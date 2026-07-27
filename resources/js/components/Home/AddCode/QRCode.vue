<template>
    <div class="space-y-5">
        <div
            v-if="error.status"
            class="rounded-xl border border-red-500/20 bg-red-500/5 p-4"
        >
            <div class="flex items-start gap-3">
                <Icons
                    name="CircleAlert"
                    :size="18"
                    class-value="mt-0.5 shrink-0 text-red-500"
                />

                <div class="min-w-0">
                    <p class="text-sm font-medium text-red-500">
                        Unable to scan QR code
                    </p>

                    <p
                        class="mt-1 break-words text-xs leading-relaxed text-red-500/80"
                    >
                        {{ error.reason }}
                    </p>
                </div>
            </div>
        </div>

        <div class="rounded-xl border border-line bg-surface p-6 text-center">
            <div
                class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-line"
            >
                <Icons name="ScanLine" :size="30" class-value="text-signal" />
            </div>

            <h3 class="mt-4 text-xl font-medium text-paper">Scan a QR code</h3>

            <p
                class="mx-auto mt-1 max-w-[40ch] text-xs leading-relaxed text-ash"
            >
                Scan the QR code provided by your service to automatically
                configure your authenticator.
            </p>

            <button
                type="button"
                class="mt-5 inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                @click="scanCode"
            >
                <Icons name="ScanLine" :size="16" />
                Scan QR Code
            </button>
        </div>

        <p class="text-center font-mono text-[10px] text-ash">
            QR scanning uses native mobile capabilities.
        </p>
    </div>
</template>

<script lang="ts" setup>
import Icons from "@/components/common/Icons.vue";
import { OtpParseError, ParsedAccount, parseOtpAuthUri } from "@/core/lib/otp";
import { saveAccount } from "@/core/lib/vault";
import {
    Scanner,
    On,
    Off,
    Events,
} from "@vendor/sghimire/mobile-scanner/resources/js/scanner.js";
import { onUnmounted, reactive, ref } from "vue";

const emit = defineEmits<{
    saved: [];
}>();

const SCAN_ID = "authenticator-code-scanner";

const error = reactive({
    status: false,
    reason: "",
});

const showError = (message: string) => {
    error.status = true;
    error.reason = message;

    setTimeout(() => {
        error.status = false;
        error.reason = "";
    }, 5000);
};

const clearError = () => {
    error.status = false;
    error.reason = "";
};

const getErrorMessage = (reason: string | null): string | null => {
    switch (reason) {
        case "user_cancelled":
            return null;

        case "camera_permission_denied":
            return "Camera permission was denied. Please allow camera access and try again.";

        case "camera_unavailable":
            return "The camera is unavailable on this device.";

        case "camera_in_use":
            return "The camera is currently being used by another application. Please close the other app and try again.";

        case "scanner_error":
            return "An unexpected error occurred while scanning the QR code. Please try again.";

        case "invalid_qr":
            return "The scanned QR code is invalid.";

        default:
            return "An unexpected error occurred while scanning. Please try again.";
    }
};

const stopListening = () => {
    Off(Events.Scanner.CodeScanned, onScanned);
    Off(Events.Scanner.Cancelled, onCancelled);
};

const scanCode = async () => {
    stopListening();

    clearError();

    On(Events.Scanner.CodeScanned, onScanned);
    On(Events.Scanner.Cancelled, onCancelled);

    try {
        await Scanner.scan().id(SCAN_ID).prompt("Scan 2FA QR Code!");
    } catch (e: any) {
        stopListening();
        showError("Unexpected Error: " + e);
    }
};

const onCancelled = (data: { reason: string | null; id: string | null }) => {
    stopListening();

    const message = getErrorMessage(data.reason);

    if (message) {
        showError(message);
    }
};

const onScanned = async (data: {
    data: string;
    format: string;
    id: string | null;
}) => {
    stopListening();

    try {
        const accountDetail: ParsedAccount = parseOtpAuthUri(data.data);

        await saveAccount(accountDetail);

        clearError();
        emit("saved");
    } catch (e: any) {
        if (e instanceof OtpParseError) {
            showError(e.message);
        } else {
            showError("Unexpected Error: " + e);
        }
    }
};

onUnmounted(() => {
    stopListening();
    Scanner.stop(SCAN_ID);
});
</script>
