import { SecureStorage } from "@vendor/sghimire/mobile-secure-storage/resources/js/secure-storage.js";
import type { Profile } from "@/core/lib/profiles";
import {
    DEFAULT_PROFILE_COLOR,
    profileAccountsIndexKey,
    profileAccountKey,
    writeProfilesIndex,
} from "@/core/lib/profiles";

const LEGACY_ACCOUNTS_INDEX_KEY = "accounts_index";
const legacyAccountKey = (id: string) => `account_${id}`;
const MIGRATION_MARKER_KEY = "migration_default_profile_id";

async function readLegacyAccountIds(): Promise<string[]> {
    const { value } = await SecureStorage.get(LEGACY_ACCOUNTS_INDEX_KEY);

    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function migrateLegacyVaultToDefaultProfile(): Promise<Profile> {
    const { value: pendingId } = await SecureStorage.get(MIGRATION_MARKER_KEY);
    const profileId = pendingId || crypto.randomUUID();

    if (!pendingId) {
        await SecureStorage.set(MIGRATION_MARKER_KEY, profileId);
    }

    const legacyIds = await readLegacyAccountIds();

    for (const id of legacyIds) {
        const { value } = await SecureStorage.get(legacyAccountKey(id));
        if (value) {
            await SecureStorage.set(profileAccountKey(profileId, id), value);
        }
    }

    await SecureStorage.set(
        profileAccountsIndexKey(profileId),
        JSON.stringify(legacyIds),
    );

    const profile: Profile = {
        id: profileId,
        name: "Default",
        color: DEFAULT_PROFILE_COLOR,
        createdAt: new Date().toISOString(),
    };

    await writeProfilesIndex([profile]);

    for (const id of legacyIds) {
        await SecureStorage.delete(legacyAccountKey(id));
    }
    await SecureStorage.delete(LEGACY_ACCOUNTS_INDEX_KEY);
    await SecureStorage.delete(MIGRATION_MARKER_KEY);

    return profile;
}
