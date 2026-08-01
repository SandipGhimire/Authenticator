import {
    Biometrics,
    Events,
    Off,
    On,
} from "@vendor/sghimire/mobile-biometric/resources/js/biometric.js";

export interface BiometricGateOptions {
    id: string;
    title: string;
    subtitle?: string;
    cancelText?: string;
    allowDeviceCredential?: boolean;
}

const RESPONSE_TIMEOUT_MS = 60_000;

export function requestBiometric(
    options: BiometricGateOptions,
): Promise<boolean> {
    return new Promise((resolve) => {
        let settled = false;

        const finish = (success: boolean) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            Off(Events.Biometric.Completed, onCompleted);
            resolve(success);
        };

        const onCompleted = (payload: { success: boolean }) => {
            finish(Boolean(payload?.success));
        };

        const timer = setTimeout(() => finish(false), RESPONSE_TIMEOUT_MS);

        On(Events.Biometric.Completed, onCompleted);

        let prompt = Biometrics.prompt()
            .id(options.id)
            .title(options.title)
            .cancelText(options.cancelText ?? "Cancel");

        if (options.subtitle) {
            prompt = prompt.subtitle(options.subtitle);
        }

        if (options.allowDeviceCredential) {
            prompt = prompt.allowDeviceCredential();
        }

        Promise.resolve(prompt).catch(() => finish(false));
    });
}
