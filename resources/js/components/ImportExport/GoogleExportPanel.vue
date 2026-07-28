<template>
    <section class="rounded-xl border border-line bg-panel p-5">
        <div class="flex items-start gap-3">
            <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface"
            >
                <Icons name="QrCode" :size="19" class-value="text-signal" />
            </div>

            <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-paper">
                    Export to Google Authenticator
                </p>

                <p class="mt-1 text-xs leading-relaxed text-ash">
                    Generate a QR code that Google Authenticator's own "Import
                    accounts" scanner can read.
                </p>
            </div>
        </div>

        <p
            v-if="accountCount === 0"
            class="mt-4 font-mono text-[11px] text-ash"
        >
            Add a code first — your vault is empty.
        </p>

        <button
            v-else
            type="button"
            class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line py-3 text-sm font-medium text-paper transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="busy"
            @click="openModal"
        >
            <Icons name="QrCode" :size="16" />
            {{ busy ? "Generating..." : "Generate QR Code" }}
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

    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="open"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
                @click.self="close"
            >
                <div
                    class="w-full max-w-sm rounded-2xl border border-line bg-panel p-5 shadow-2xl"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div
                            class="flex h-11 w-11 items-center justify-center rounded-full bg-signal/10"
                        >
                            <Icons
                                name="QrCode"
                                :size="20"
                                class-value="text-signal"
                            />
                        </div>

                        <button
                            type="button"
                            class="rounded-lg p-2 text-ash transition-colors hover:bg-surface hover:text-paper"
                            aria-label="Close"
                            @click="close"
                        >
                            <Icons name="X" :size="18" />
                        </button>
                    </div>

                    <p
                        class="mt-4 font-display text-base font-semibold text-paper"
                    >
                        Scan with Google Authenticator
                    </p>

                    <p class="mt-1.5 text-sm leading-relaxed text-ash">
                        Open Google Authenticator, choose
                        <span class="text-paper">Import existing accounts</span
                        >, then scan this code.
                    </p>

                    <div
                        class="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs leading-relaxed text-red-500/90"
                    >
                        Anyone who scans this code gets full access to these
                        accounts. Only show it to a device and app you trust,
                        then close this dialog.
                    </div>

                    <div
                        class="mt-4 flex items-center justify-center rounded-xl p-4"
                    >
                        <img
                            v-if="currentImage"
                            :src="currentImage"
                            :alt="`Google Authenticator import QR code${pages.length > 1 ? ` (part ${pageIndex + 1} of ${pages.length})` : ''}`"
                            class="h-64 w-64"
                        />
                    </div>

                    <div
                        v-if="pages.length > 1"
                        class="mt-4 flex items-center justify-between gap-3"
                    >
                        <button
                            type="button"
                            class="flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-medium text-paper transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                            :disabled="pageIndex === 0"
                            @click="pageIndex -= 1"
                        >
                            <Icons name="ChevronLeft" :size="14" />
                            Prev
                        </button>

                        <p class="font-mono text-[11px] text-ash">
                            Part {{ pageIndex + 1 }} of {{ pages.length }}
                        </p>

                        <button
                            type="button"
                            class="flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-medium text-paper transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                            :disabled="pageIndex === pages.length - 1"
                            @click="pageIndex += 1"
                        >
                            Next
                            <Icons name="ChevronRight" :size="14" />
                        </button>
                    </div>

                    <p
                        v-if="pages.length > 1"
                        class="mt-2 text-center font-mono text-[10px] text-ash"
                    >
                        Too many accounts for one code — scan every part.
                    </p>

                    <button
                        type="button"
                        class="mt-4 w-full rounded-lg bg-signal py-2.5 text-sm font-medium text-paper transition-colors active:opacity-90"
                        @click="close"
                    >
                        Done
                    </button>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import QRCode from "qrcode";
import Icons from "@/components/common/Icons.vue";
import { listAccounts } from "@/core/lib/vault";
import {
    buildGoogleMigrationQr,
    OtpParseError,
} from "@/core/lib/googleTransfer";
import type { ParsedAccount } from "@/core/lib/otp";

defineProps<{
    accountCount: number;
}>();

const open = ref(false);
const busy = ref(false);
const pages = ref<string[]>([]);
const pageIndex = ref(0);

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
    }, 6000);
};

const currentImage = computed(() => pages.value[pageIndex.value] ?? "");

const openModal = async () => {
    if (busy.value) return;

    status.message = "";
    busy.value = true;

    try {
        const accounts: ParsedAccount[] = (await listAccounts()).map(
            ({ name, username, secret, algorithm, digits, period }) => ({
                name,
                username,
                secret,
                algorithm,
                digits,
                period,
            }),
        );

        const uris = buildGoogleMigrationQr(accounts);

        pages.value = await Promise.all(
            uris.map((uri) =>
                QRCode.toDataURL(uri, {
                    errorCorrectionLevel: "medium",
                    margin: 1,
                    width: 448,
                    color: { dark: "#000000", light: "#ffffff" },
                }),
            ),
        );

        pageIndex.value = 0;
        open.value = true;
    } catch (e) {
        showStatus(
            "error",
            e instanceof OtpParseError
                ? e.message
                : "Something went wrong while generating the QR code.",
        );
    } finally {
        busy.value = false;
    }
};

const close = () => {
    open.value = false;
    pages.value = [];
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
