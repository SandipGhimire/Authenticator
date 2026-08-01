import { defineStore } from "pinia";
import { requestBiometric } from "@/core/lib/biometricGate";
import {
    createProfile as createProfileRecord,
    deleteProfile as deleteProfileRecord,
    ensureBootstrapped,
    getStoredActiveProfileId,
    listProfiles,
    persistActiveProfileId,
    renameProfile as renameProfileRecord,
    resolveBootProfileId,
    setActiveProfileIdCache,
    type Profile,
} from "@/core/lib/profiles";
import {
    DEFAULT_SETTINGS,
    loadSettings,
    saveSettings,
    type AppSettings,
} from "@/core/lib/settings";

export type BootstrapPhase =
    "idle" | "migrating" | "loading-settings" | "resolving" | "ready";

interface ProfileState {
    phase: BootstrapPhase;
    profiles: Profile[];
    activeProfileId: string | null;
    settings: AppSettings;
}

interface SwitchOptions {
    skipBiometric?: boolean;
}

const useProfile = defineStore("profile", {
    state: (): ProfileState => ({
        phase: "idle",
        profiles: [],
        activeProfileId: null,
        settings: { ...DEFAULT_SETTINGS },
    }),

    getters: {
        activeProfile(state): Profile | null {
            return (
                state.profiles.find(
                    (profile) => profile.id === state.activeProfileId,
                ) ?? null
            );
        },
    },

    actions: {
        lock() {
            setActiveProfileIdCache(null);
            this.activeProfileId = null;
            this.phase = "idle";
        },

        async bootstrap() {
            setActiveProfileIdCache(null);
            this.activeProfileId = null;

            this.phase = "migrating";
            await ensureBootstrapped();

            this.phase = "loading-settings";
            this.settings = await loadSettings();
            this.profiles = await listProfiles();

            this.phase = "resolving";
            const lastUsedId = await getStoredActiveProfileId();
            const resolved = resolveBootProfileId(
                this.profiles,
                this.settings,
                lastUsedId,
            );

            if (resolved) {
                await this.switchTo(resolved, { skipBiometric: true });
            }

            this.phase = "ready";
        },

        async refreshProfiles() {
            this.profiles = await listProfiles();
        },

        async switchTo(
            id: string,
            options: SwitchOptions = {},
        ): Promise<boolean> {
            if (id === this.activeProfileId) {
                return true;
            }

            if (
                !options.skipBiometric &&
                this.settings.requireBiometricOnSwitch
            ) {
                const target = this.profiles.find(
                    (profile) => profile.id === id,
                );
                const ok = await requestBiometric({
                    id: `profile-switch-${id}`,
                    title: "Switch profile",
                    subtitle: target
                        ? `Confirm it's you to switch to "${target.name}"`
                        : "Confirm it's you to switch profiles",
                    allowDeviceCredential: true,
                });

                if (!ok) {
                    return false;
                }
            }

            setActiveProfileIdCache(id);
            this.activeProfileId = id;
            await persistActiveProfileId(id);

            return true;
        },

        async createProfile(name: string, color?: string): Promise<Profile> {
            const profile = await createProfileRecord(name, color);
            await this.refreshProfiles();

            if (this.profiles.length > 1) {
                await this.updateSettings({ multiProfileEnabled: true });
            }

            return profile;
        },

        async renameProfile(id: string, name: string) {
            await renameProfileRecord(id, name);
            await this.refreshProfiles();
        },

        async deleteProfile(id: string): Promise<boolean> {
            if (this.settings.requireBiometricOnDelete) {
                const target = this.profiles.find(
                    (profile) => profile.id === id,
                );
                const ok = await requestBiometric({
                    id: `profile-delete-${id}`,
                    title: "Delete profile",
                    subtitle: target
                        ? `Confirm it's you to permanently delete "${target.name}"`
                        : "Confirm it's you to permanently delete this profile",
                    allowDeviceCredential: true,
                });

                if (!ok) {
                    return false;
                }
            }

            await deleteProfileRecord(id);
            await this.refreshProfiles();

            if (this.settings.bootProfileId === id) {
                await this.updateSettings({ bootProfileId: null });
            }

            return true;
        },

        async updateSettings(partial: Partial<AppSettings>) {
            this.settings = { ...this.settings, ...partial };
            await saveSettings(this.settings);
        },
    },
});

export default useProfile;
