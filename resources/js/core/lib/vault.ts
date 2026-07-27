import { SecureStorage } from "@vendor/sghimire/mobile-secure-storage/resources/js/secure-storage.js";
import {
    buildManualAccount,
    OtpParseError,
    type ParsedAccount,
} from "@/core/lib/otp";

export interface StoredAccount extends ParsedAccount {
    id: string;
    createdAt: string;
}

const INDEX_KEY = "accounts_index";
const recordKey = (id: string) => `account_${id}`;

async function readIndex(): Promise<string[]> {
    const { value } = await SecureStorage.get(INDEX_KEY);

    if (!value) {
        return [];
    }

    try {
        return JSON.parse(value) as string[];
    } catch {
        return [];
    }
}

async function writeIndex(ids: string[]): Promise<void> {
    await SecureStorage.set(INDEX_KEY, JSON.stringify(ids));
}

let indexLock: Promise<void> = Promise.resolve();

function withIndexLock<T>(task: () => Promise<T>): Promise<T> {
    const result = indexLock.then(task, task);
    indexLock = result.then(
        () => undefined,
        () => undefined,
    );
    return result;
}

export async function listAccounts(): Promise<StoredAccount[]> {
    const ids = await readIndex();

    const records = await Promise.all(
        ids.map(async (id) => {
            const { value } = await SecureStorage.get(recordKey(id));
            if (!value) return null;
            try {
                return JSON.parse(value) as StoredAccount;
            } catch {
                return null;
            }
        }),
    );

    return records.filter((r): r is StoredAccount => r !== null);
}

export async function saveAccount(
    account: ParsedAccount,
): Promise<StoredAccount> {
    const stored: StoredAccount = {
        ...account,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };

    await SecureStorage.set(recordKey(stored.id), JSON.stringify(stored));

    await withIndexLock(async () => {
        const ids = await readIndex();
        await writeIndex([...ids, stored.id]);
    });

    return stored;
}

export async function deleteAccount(id: string): Promise<void> {
    await SecureStorage.delete(recordKey(id));

    await withIndexLock(async () => {
        const ids = await readIndex();
        await writeIndex(ids.filter((existingId) => existingId !== id));
    });
}

export interface ImportSummary {
    added: number;
    duplicates: number;
    invalid: number;
}

function isSameAccount(a: ParsedAccount, b: ParsedAccount): boolean {
    return (
        a.secret === b.secret &&
        a.algorithm === b.algorithm &&
        a.digits === b.digits &&
        a.period === b.period &&
        a.name === b.name &&
        a.username === b.username
    );
}

/**
 * Merges backup accounts into the vault: entries that already exist
 * (identical name/username/secret/algorithm/digits/period) are skipped,
 * malformed entries are counted but not saved, and everything else is added.
 */
export async function importAccounts(
    candidates: ParsedAccount[],
): Promise<ImportSummary> {
    const existing = await listAccounts();
    const summary: ImportSummary = { added: 0, duplicates: 0, invalid: 0 };

    for (const candidate of candidates) {
        let account: ParsedAccount;

        try {
            account = buildManualAccount(candidate);
        } catch (e) {
            if (e instanceof OtpParseError) {
                summary.invalid += 1;
                continue;
            }
            throw e;
        }

        if (existing.some((stored) => isSameAccount(stored, account))) {
            summary.duplicates += 1;
            continue;
        }

        const stored = await saveAccount(account);
        existing.push(stored);
        summary.added += 1;
    }

    return summary;
}
