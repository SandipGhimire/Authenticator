<template>
    <section class="rounded-xl border border-line bg-panel p-5">
        <div class="flex items-start gap-3">
            <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface"
            >
                <Icons name="ScanLine" :size="19" class-value="text-signal" />
            </div>

            <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-paper">
                    Google Authenticator Import
                </p>

                <p class="mt-1 text-xs leading-relaxed text-ash">
                    Scan the QR code from Google Authenticator's "Transfer Code"
                    screen to bring its codes into your vault. Codes already in
                    your vault are skipped automatically.
                </p>
            </div>
        </div>

        <button
            type="button"
            class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line py-3 text-sm font-medium text-paper transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            @click="scanCode"
        >
            <Icons name="ScanLine" :size="16" />
            Scan QR Code
        </button>

        <div
            v-if="status.message"
            class="mt-3 rounded-lg border p-3 text-xs leading-relaxed"
            :class="
                status.type === 'error'
                    ? 'border-red-500/20 bg-red-500/5 text-red-500/90'
                    : 'border-signal/20 bg-signal/5 text-signal-bright'
            "
        >
            {{ status.message }}
        </div>
    </section>
</template>

<script setup lang="ts">
import { reactive, ref, onUnmounted } from "vue";
import Icons from "@/components/common/Icons.vue";
import {
    OtpParseError,
    parseGoogleMigrationQr,
} from "@/core/lib/googleTransfer";
import { importAccounts } from "@/core/lib/vault";
import {
    Scanner,
    On,
    Off,
    Events,
} from "@vendor/sghimire/mobile-scanner/resources/js/scanner.js";

const emit = defineEmits<{
    imported: [];
}>();

const SCAN_ID = "google-migration-scanner";

const status = reactive<{ type: "success" | "error"; message: string }>({
    type: "success",
    message: "",
});

let statusTimer: ReturnType<typeof setTimeout> | undefined;

const showStatus = (type: "success" | "error", message: string) => {
    status.type = type;
    status.message = message;

    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
        status.message = "";
    }, 7000);
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
    status.message = "";

    On(Events.Scanner.CodeScanned, onScanned);
    On(Events.Scanner.Cancelled, onCancelled);

    try {
        await Scanner.scan()
            .id(SCAN_ID)
            .prompt("Scan Google Authenticator Export QR Code!");
    } catch (e: any) {
        stopListening();
        showStatus("error", "Unexpected Error: " + e);
    }
};

const onCancelled = (data: { reason: string | null; id: string | null }) => {
    if (data.id !== SCAN_ID) return;
    stopListening();

    const message = getErrorMessage(data.reason);

    if (message) {
        showStatus("error", message);
    }
};

const onScanned = async (data: {
    data: string;
    format: string;
    id: string | null;
}) => {
    if (data.id !== SCAN_ID) return;
    stopListening();

    try {
        const result = parseGoogleMigrationQr(data.data);
        const summary = await importAccounts(result.accounts);

        const parts: string[] = [];
        if (summary.added) parts.push(`${summary.added} added`);
        if (summary.duplicates)
            parts.push(`${summary.duplicates} already in your vault`);
        if (summary.invalid || result.skipped) {
            const invalidTotal = summary.invalid + result.skipped;
            parts.push(`${invalidTotal} skipped (unsupported)`);
        }

        let message = parts.length
            ? `Import complete — ${parts.join(", ")}.`
            : "Nothing to import — the QR code had no usable accounts.";

        if (result.batchSize > 1) {
            message += ` This QR code was part ${result.batchIndex + 1} of ${result.batchSize} — scan the other export QR codes to import everything.`;
        }

        showStatus("success", message);
        emit("imported");
    } catch (e: any) {
        if (e instanceof OtpParseError) {
            showStatus("error", e.message);
        } else {
            showStatus("error", "Unexpected Error: " + e);
        }
    }
};

onUnmounted(() => {
    stopListening();
    Scanner.stop(SCAN_ID);
});
</script>
