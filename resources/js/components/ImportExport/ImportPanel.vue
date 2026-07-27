<template>
    <section class="rounded-xl border border-line bg-panel p-5">
        <div class="flex items-start gap-3">
            <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface"
            >
                <Icons name="Upload" :size="19" class-value="text-signal" />
            </div>

            <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-paper">Import backup</p>

                <p class="mt-1 text-xs leading-relaxed text-ash">
                    Restore accounts from an encrypted
                    <span class="font-mono text-[11px] text-paper"
                        >.auth.bak</span
                    >
                    file. Codes already in your vault are skipped automatically.
                </p>
            </div>
        </div>

        <button
            type="button"
            class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line py-3 text-sm font-medium text-paper transition-colors hover:bg-surface disabled:opacity-60"
            :disabled="busy"
            @click="pickFile"
        >
            <Icons name="Upload" :size="16" />
            Choose Backup File
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
                    <div
                        class="flex h-11 w-11 items-center justify-center rounded-full bg-signal/10"
                    >
                        <Icons
                            name="LockKeyhole"
                            :size="20"
                            class-value="text-signal"
                        />
                    </div>

                    <p
                        class="mt-4 font-display text-base font-semibold text-paper"
                    >
                        Enter backup password
                    </p>

                    <p class="mt-1.5 text-sm leading-relaxed text-ash">
                        Enter the password this backup was encrypted with. It
                        won't decrypt with anything else.
                    </p>

                    <form class="mt-4 space-y-3" @submit.prevent="submit">
                        <div
                            v-if="error"
                            class="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs leading-relaxed text-red-500/90"
                        >
                            {{ error }}
                        </div>

                        <div>
                            <label class="mb-1.5 block text-xs text-ash">
                                Password
                            </label>

                            <div class="relative">
                                <input
                                    v-model="password"
                                    :type="reveal ? 'text' : 'password'"
                                    autocomplete="current-password"
                                    placeholder="Backup password"
                                    class="pr-10"
                                />

                                <button
                                    type="button"
                                    class="absolute top-1/2 right-3 -translate-y-1/2 text-ash transition-colors hover:text-paper"
                                    :aria-label="
                                        reveal
                                            ? 'Hide password'
                                            : 'Show password'
                                    "
                                    @click="reveal = !reveal"
                                >
                                    <Icons
                                        :name="reveal ? 'EyeOff' : 'Eye'"
                                        :size="16"
                                    />
                                </button>
                            </div>
                        </div>

                        <div class="flex gap-3 pt-2">
                            <button
                                type="button"
                                class="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-paper transition-colors hover:bg-surface disabled:opacity-60"
                                :disabled="busy"
                                @click="close"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="flex-1 rounded-lg bg-signal py-2.5 text-sm font-medium text-paper transition-colors active:opacity-90 disabled:opacity-60"
                                :disabled="busy"
                            >
                                {{ busy ? "Decrypting..." : "Import" }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import Icons from "@/components/common/Icons.vue";
import {
    BackupError,
    decryptBackup,
    isLikelyBackupFile,
} from "@/core/lib/backup";
import { importAccounts } from "@/core/lib/vault";
import {
    Events,
    FileAccess,
    fromBase64,
    Off,
    On,
} from "@vendor/sghimire/mobile-file-access/resources/js/file-access.js";

const emit = defineEmits<{
    imported: [];
}>();

const pickedBytes = ref<Uint8Array | null>(null);

const open = ref(false);
const busy = ref(false);
const reveal = ref(false);
const password = ref("");
const error = ref("");

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

type PickedPayload = {
    fileName: string;
    mimeType: string;
    size: number;
    contentBase64: string;
    id: string | null;
};
type PickCancelledPayload = { reason: string | null; id: string | null };

const pickFile = async () => {
    const pickId = crypto.randomUUID();

    const onPicked = (payload: PickedPayload) => {
        if (payload.id !== pickId) return;
        Off(Events.FileAccess.FilePicked, onPicked);
        Off(Events.FileAccess.PickCancelled, onCancelled);

        const bytes = fromBase64(payload.contentBase64);

        if (!isLikelyBackupFile(bytes)) {
            showStatus(
                "error",
                "That file isn't a recognized Authenticator backup (.auth.bak).",
            );
            return;
        }

        pickedBytes.value = bytes;
        password.value = "";
        error.value = "";
        open.value = true;
    };

    const onCancelled = (payload: PickCancelledPayload) => {
        if (payload.id !== pickId) return;
        Off(Events.FileAccess.FilePicked, onPicked);
        Off(Events.FileAccess.PickCancelled, onCancelled);

        if (payload.reason !== "user_cancelled") {
            showStatus(
                "error",
                "Something went wrong while reading that file.",
            );
        }
    };

    On(Events.FileAccess.FilePicked, onPicked);
    On(Events.FileAccess.PickCancelled, onCancelled);

    await FileAccess.pick().id(pickId);
};

const close = () => {
    if (busy.value) return;
    open.value = false;
    pickedBytes.value = null;
};

const submit = async () => {
    error.value = "";

    if (!pickedBytes.value) {
        close();
        return;
    }

    if (!password.value) {
        error.value = "Enter the backup password.";
        return;
    }

    busy.value = true;

    try {
        const accounts = await decryptBackup(pickedBytes.value, password.value);
        const summary = await importAccounts(accounts);

        open.value = false;
        pickedBytes.value = null;

        const parts: string[] = [];
        if (summary.added) parts.push(`${summary.added} added`);
        if (summary.duplicates)
            parts.push(`${summary.duplicates} already in your vault`);
        if (summary.invalid) parts.push(`${summary.invalid} skipped (invalid)`);

        showStatus(
            "success",
            parts.length
                ? `Import complete — ${parts.join(", ")}.`
                : "Nothing to import — the backup was empty.",
        );

        emit("imported");
    } catch (e) {
        error.value =
            e instanceof BackupError
                ? e.message
                : "Something went wrong while importing this backup.";
    } finally {
        busy.value = false;
    }
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
