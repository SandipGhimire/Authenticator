<template>
    <section class="rounded-xl border border-line bg-panel p-5">
        <div class="flex items-start gap-3">
            <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface"
            >
                <Icons name="Download" :size="19" class-value="text-signal" />
            </div>

            <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-paper">Export backup</p>

                <p class="mt-1 text-xs leading-relaxed text-ash">
                    Save an encrypted copy of your vault to a file. You choose
                    the password — without that exact password, the backup can
                    never be decrypted.
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
            class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
            :disabled="busy"
            @click="openModal"
        >
            <Icons name="Download" :size="16" />
            Export Backup
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

                    <template v-if="step === 'select'">
                        <p
                            class="mt-4 font-display text-base font-semibold text-paper"
                        >
                            Choose accounts
                        </p>

                        <p class="mt-1.5 text-sm leading-relaxed text-ash">
                            Pick which accounts to include in this backup.
                        </p>

                        <div class="mt-4">
                            <AccountPicker
                                :accounts="accounts"
                                v-model="selectedIds"
                            />
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button
                                type="button"
                                class="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-paper transition-colors hover:bg-surface"
                                @click="close"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                class="flex-1 rounded-lg bg-signal py-2.5 text-sm font-medium text-paper transition-colors active:opacity-90 disabled:opacity-60"
                                :disabled="selectedIds.length === 0"
                                @click="step = 'password'"
                            >
                                Continue
                            </button>
                        </div>
                    </template>

                    <template v-else>
                        <p
                            class="mt-4 font-display text-base font-semibold text-paper"
                        >
                            Set a backup password
                        </p>

                        <p class="mt-1.5 text-sm leading-relaxed text-ash">
                            You'll need this exact password to restore this
                            backup later. If you forget it, the backup cannot be
                            recovered — there is no reset.
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
                                        autocomplete="new-password"
                                        placeholder="At least 6 characters"
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

                            <div>
                                <label class="mb-1.5 block text-xs text-ash">
                                    Confirm password
                                </label>

                                <input
                                    v-model="confirmPassword"
                                    :type="reveal ? 'text' : 'password'"
                                    autocomplete="new-password"
                                    placeholder="Re-enter password"
                                />
                            </div>

                            <div class="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    class="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-paper transition-colors hover:bg-surface disabled:opacity-60"
                                    :disabled="busy"
                                    @click="step = 'select'"
                                >
                                    Back
                                </button>

                                <button
                                    type="submit"
                                    class="flex-1 rounded-lg bg-signal py-2.5 text-sm font-medium text-paper transition-colors active:opacity-90 disabled:opacity-60"
                                    :disabled="busy"
                                >
                                    {{ busy ? "Encrypting..." : "Export" }}
                                </button>
                            </div>
                        </form>
                    </template>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import Icons from "@/components/common/Icons.vue";
import AccountPicker from "@/components/ImportExport/AccountPicker.vue";
import { listAccounts, type StoredAccount } from "@/core/lib/vault";
import { buildBackupFilename, encryptBackup } from "@/core/lib/backup";
import type { ParsedAccount } from "@/core/lib/otp";
import {
    Events,
    FileAccess,
    Off,
    On,
} from "@vendor/sghimire/mobile-file-access/resources/js/file-access.js";

defineProps<{
    accountCount: number;
}>();

const emit = defineEmits<{
    exported: [];
}>();

const open = ref(false);
const busy = ref(false);
const reveal = ref(false);
const password = ref("");
const confirmPassword = ref("");
const error = ref("");

const step = ref<"select" | "password">("select");
const accounts = ref<StoredAccount[]>([]);
const selectedIds = ref<string[]>([]);

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

const openModal = async () => {
    password.value = "";
    confirmPassword.value = "";
    error.value = "";
    step.value = "select";

    accounts.value = await listAccounts();
    selectedIds.value = accounts.value.map((account) => account.id);

    open.value = true;
};

const close = () => {
    if (busy.value) return;
    open.value = false;
};

const submit = async () => {
    error.value = "";

    if (password.value.length < 6) {
        error.value = "Password must be at least 6 characters.";
        return;
    }

    if (password.value !== confirmPassword.value) {
        error.value = "Passwords don't match.";
        return;
    }

    busy.value = true;

    try {
        const selected: ParsedAccount[] = accounts.value
            .filter((account) => selectedIds.value.includes(account.id))
            .map(({ name, username, secret, algorithm, digits, period }) => ({
                name,
                username,
                secret,
                algorithm,
                digits,
                period,
            }));

        const bytes = await encryptBackup(selected, password.value);
        const exportId = crypto.randomUUID();

        type SavedPayload = {
            fileName: string;
            size: number;
            id: string | null;
        };
        type SaveCancelledPayload = {
            reason: string | null;
            id: string | null;
        };

        const onSaved = (payload: SavedPayload) => {
            if (payload.id !== exportId) return;
            Off(Events.FileAccess.FileSaved, onSaved);
            Off(Events.FileAccess.SaveCancelled, onCancelled);
            showStatus(
                "success",
                `Backup exported as ${payload.fileName}. Store the file and password somewhere safe.`,
            );
            emit("exported");
        };

        const onCancelled = (payload: SaveCancelledPayload) => {
            if (payload.id !== exportId) return;
            Off(Events.FileAccess.FileSaved, onSaved);
            Off(Events.FileAccess.SaveCancelled, onCancelled);
            if (payload.reason !== "user_cancelled") {
                showStatus(
                    "error",
                    "Something went wrong while saving the backup file.",
                );
            }
        };

        On(Events.FileAccess.FileSaved, onSaved);
        On(Events.FileAccess.SaveCancelled, onCancelled);

        await FileAccess.save(buildBackupFilename(), bytes).id(exportId);

        open.value = false;
    } catch {
        error.value =
            "Something went wrong while encrypting your backup. Please try again.";
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
