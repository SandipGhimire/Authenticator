import type { ParsedAccount } from "@/core/lib/otp";

const MAGIC = new TextEncoder().encode("AUTHVLT1");
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const HEADER_LENGTH = MAGIC.length + 4 + SALT_LENGTH + IV_LENGTH;
const PBKDF2_ITERATIONS = 600_000;

export class BackupError extends Error {}

interface BackupPayload {
    version: 1;
    exportedAt: string;
    accounts: ParsedAccount[];
}

function bytesMatch(a: Uint8Array, b: Uint8Array): boolean {
    return a.length === b.length && a.every((byte, i) => byte === b[i]);
}

async function deriveKey(
    password: string,
    salt: Uint8Array<ArrayBuffer>,
    iterations: number,
    usage: "encrypt" | "decrypt",
): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"],
    );

    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        [usage],
    );
}

export function buildBackupFilename(date: Date = new Date()): string {
    const pad = (value: number) => value.toString().padStart(2, "0");

    const timestamp =
        `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
        `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

    return `authenticator_${timestamp}.auth.bak`;
}

export function isLikelyBackupFile(bytes: Uint8Array): boolean {
    if (bytes.length <= HEADER_LENGTH) {
        return false;
    }

    return bytesMatch(bytes.slice(0, MAGIC.length), MAGIC);
}

export async function encryptBackup(
    accounts: ParsedAccount[],
    password: string,
): Promise<Uint8Array> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKey(password, salt, PBKDF2_ITERATIONS, "encrypt");

    const payload: BackupPayload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        accounts,
    };

    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext),
    );

    const iterations = new Uint8Array(4);
    new DataView(iterations.buffer).setUint32(0, PBKDF2_ITERATIONS, true);

    const bytes = new Uint8Array(
        MAGIC.length +
            iterations.length +
            salt.length +
            iv.length +
            ciphertext.length,
    );

    let offset = 0;
    bytes.set(MAGIC, offset);
    offset += MAGIC.length;
    bytes.set(iterations, offset);
    offset += iterations.length;
    bytes.set(salt, offset);
    offset += salt.length;
    bytes.set(iv, offset);
    offset += iv.length;
    bytes.set(ciphertext, offset);

    return bytes;
}

export async function decryptBackup(
    bytes: Uint8Array,
    password: string,
): Promise<ParsedAccount[]> {
    if (bytes.length <= HEADER_LENGTH) {
        throw new BackupError("This file isn't a valid Authenticator backup.");
    }

    let offset = 0;
    const magic = bytes.slice(offset, offset + MAGIC.length);
    offset += MAGIC.length;

    if (!bytesMatch(magic, MAGIC)) {
        throw new BackupError("This file isn't a valid Authenticator backup.");
    }

    const iterationsBytes = bytes.slice(offset, offset + 4);
    offset += 4;
    const iterations = new DataView(iterationsBytes.buffer).getUint32(0, true);

    const salt = bytes.slice(offset, offset + SALT_LENGTH);
    offset += SALT_LENGTH;
    const iv = bytes.slice(offset, offset + IV_LENGTH);
    offset += IV_LENGTH;
    const ciphertext = bytes.slice(offset);

    if (ciphertext.length === 0 || iterations <= 0) {
        throw new BackupError("This backup file is corrupted.");
    }

    const key = await deriveKey(password, salt, iterations, "decrypt");

    let plaintext: ArrayBuffer;

    try {
        plaintext = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ciphertext,
        );
    } catch {
        throw new BackupError(
            "Incorrect password, or this backup file is corrupted.",
        );
    }

    let payload: BackupPayload;

    try {
        payload = JSON.parse(new TextDecoder().decode(plaintext));
    } catch {
        throw new BackupError("This backup file is corrupted.");
    }

    if (!payload || !Array.isArray(payload.accounts)) {
        throw new BackupError("This backup file is corrupted.");
    }

    return payload.accounts;
}
