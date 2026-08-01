import { SecureStorage } from "@vendor/sghimire/mobile-secure-storage/resources/js/secure-storage.js";

export interface AppSettings {
    multiProfileEnabled: boolean;
    rememberLastProfile: boolean;
    bootProfileId: string | null;
    requireBiometricOnSwitch: boolean;
    requireBiometricOnDelete: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
    multiProfileEnabled: false,
    rememberLastProfile: true,
    bootProfileId: null,
    requireBiometricOnSwitch: true,
    requireBiometricOnDelete: true,
};

const SETTINGS_KEY = "app_settings";

export async function loadSettings(): Promise<AppSettings> {
    const { value } = await SecureStorage.get(SETTINGS_KEY);

    if (!value) {
        return { ...DEFAULT_SETTINGS };
    }

    try {
        const parsed = JSON.parse(value);
        return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    await SecureStorage.set(SETTINGS_KEY, JSON.stringify(settings));
}
