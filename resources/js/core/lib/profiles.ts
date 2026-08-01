import { SecureStorage } from "@vendor/sghimire/mobile-secure-storage/resources/js/secure-storage.js";
import { migrateLegacyVaultToDefaultProfile } from "@/core/lib/profileMigration";
import type { AppSettings } from "@/core/lib/settings";

export interface Profile {
    id: string;
    name: string;
    color: string;
    createdAt: string;
}

export const PROFILE_COLORS = [
    "#7ec1f0",
    "#f0b429",
    "#f2545b",
    "#34d399",
    "#a78bfa",
    "#fb923c",
    "#22d3ee",
    "#f472b6",
] as const;

export const DEFAULT_PROFILE_COLOR: string = PROFILE_COLORS[0];

export function pickProfileColor(existingCount: number): string {
    return PROFILE_COLORS[existingCount % PROFILE_COLORS.length];
}

const PROFILES_INDEX_KEY = "profiles_index";
const ACTIVE_PROFILE_KEY = "active_profile_id";

export const profileAccountsIndexKey = (profileId: string) =>
    `profile_${profileId}_accounts_index`;

export const profileAccountKey = (profileId: string, accountId: string) =>
    `profile_${profileId}_account_${accountId}`;

export class ProfileError extends Error {}

export async function listProfiles(): Promise<Profile[]> {
    const { value } = await SecureStorage.get(PROFILES_INDEX_KEY);

    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as Profile[]) : [];
    } catch {
        return [];
    }
}

export async function writeProfilesIndex(profiles: Profile[]): Promise<void> {
    await SecureStorage.set(PROFILES_INDEX_KEY, JSON.stringify(profiles));
}

export async function createProfile(
    name: string,
    color?: string,
): Promise<Profile> {
    const trimmed = name.trim();

    if (!trimmed) {
        throw new ProfileError("Give this profile a name.");
    }

    const profiles = await listProfiles();

    const profile: Profile = {
        id: crypto.randomUUID(),
        name: trimmed,
        color: color ?? pickProfileColor(profiles.length),
        createdAt: new Date().toISOString(),
    };

    await writeProfilesIndex([...profiles, profile]);

    return profile;
}

export async function renameProfile(id: string, name: string): Promise<void> {
    const trimmed = name.trim();

    if (!trimmed) {
        throw new ProfileError("Give this profile a name.");
    }

    const profiles = await listProfiles();
    const index = profiles.findIndex((profile) => profile.id === id);

    if (index === -1) {
        throw new ProfileError("That profile no longer exists.");
    }

    profiles[index] = { ...profiles[index], name: trimmed };
    await writeProfilesIndex(profiles);
}

export async function deleteProfile(id: string): Promise<void> {
    const profiles = await listProfiles();

    if (profiles.length <= 1) {
        throw new ProfileError("At least one profile must remain.");
    }

    if (getActiveProfileIdOrNull() === id) {
        throw new ProfileError(
            "Switch to another profile before deleting this one.",
        );
    }

    if (!profiles.some((profile) => profile.id === id)) {
        throw new ProfileError("That profile no longer exists.");
    }

    const { value: indexRaw } = await SecureStorage.get(
        profileAccountsIndexKey(id),
    );
    let accountIds: string[] = [];

    if (indexRaw) {
        try {
            const parsed = JSON.parse(indexRaw);
            accountIds = Array.isArray(parsed) ? parsed : [];
        } catch {
            accountIds = [];
        }
    }

    for (const accountId of accountIds) {
        await SecureStorage.delete(profileAccountKey(id, accountId));
    }

    await SecureStorage.delete(profileAccountsIndexKey(id));
    await writeProfilesIndex(profiles.filter((profile) => profile.id !== id));
}

let activeProfileIdCache: string | null = null;

export function getActiveProfileId(): string {
    if (!activeProfileIdCache) {
        throw new ProfileError("No active profile selected.");
    }

    return activeProfileIdCache;
}

export function getActiveProfileIdOrNull(): string | null {
    return activeProfileIdCache;
}

export function setActiveProfileIdCache(id: string | null): void {
    activeProfileIdCache = id;
}

export async function getStoredActiveProfileId(): Promise<string | null> {
    const { value } = await SecureStorage.get(ACTIVE_PROFILE_KEY);
    return value || null;
}

export async function persistActiveProfileId(id: string): Promise<void> {
    await SecureStorage.set(ACTIVE_PROFILE_KEY, id);
}

export async function ensureBootstrapped(): Promise<void> {
    const profiles = await listProfiles();

    if (profiles.length > 0) {
        return;
    }

    await migrateLegacyVaultToDefaultProfile();
}

export function resolveBootProfileId(
    profiles: Profile[],
    settings: Pick<AppSettings, "bootProfileId" | "rememberLastProfile">,
    lastUsedId: string | null,
): string | null {
    if (
        settings.bootProfileId &&
        profiles.some((profile) => profile.id === settings.bootProfileId)
    ) {
        return settings.bootProfileId;
    }

    if (
        settings.rememberLastProfile &&
        lastUsedId &&
        profiles.some((profile) => profile.id === lastUsedId)
    ) {
        return lastUsedId;
    }

    if (profiles.length === 1) {
        return profiles[0].id;
    }

    return null;
}
