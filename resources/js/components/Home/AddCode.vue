<template>
    <!-- Floating Add Button -->
    <button
        type="button"
        class="fixed right-6 bottom-[100px] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-signal text-paper shadow-lg transition-transform active:scale-95"
        aria-label="Add authentication code"
        @click="open = true"
    >
        <Icons name="Plus" :size="24" />
    </button>

    <!-- Add Code Sheet -->
    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="open"
                class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4"
                @click.self="close"
            >
                <div
                    class="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between border-b border-line px-5 py-4"
                    >
                        <div>
                            <p class="font-display text-base font-semibold text-paper">
                                Add account
                            </p>

                            <p class="mt-0.5 text-xs text-ash">
                                Add a new two-factor authentication code.
                            </p>
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

                    <!-- Tabs -->
                    <div class="border-b border-line px-5">
                        <div class="flex gap-6">
                            <button
                                type="button"
                                class="relative py-3 font-mono text-xs transition-colors"
                                :class="
                                    tab === 'scan'
                                        ? 'text-signal'
                                        : 'text-ash hover:text-paper'
                                "
                                @click="tab = 'scan'"
                            >
                                Scan Code

                                <span
                                    v-if="tab === 'scan'"
                                    class="absolute right-0 bottom-0 left-0 h-px bg-signal"
                                />
                            </button>

                            <button
                                type="button"
                                class="relative py-3 font-mono text-xs transition-colors"
                                :class="
                                    tab === 'manual'
                                        ? 'text-signal'
                                        : 'text-ash hover:text-paper'
                                "
                                @click="tab = 'manual'"
                            >
                                Manual Entry

                                <span
                                    v-if="tab === 'manual'"
                                    class="absolute right-0 bottom-0 left-0 h-px bg-signal"
                                />
                            </button>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="p-5">
                        <!-- Scan Code -->
                        <div v-if="tab === 'scan'" class="space-y-5">
                            <div
                                class="rounded-xl border border-line bg-surface p-6 text-center"
                            >
                                <div
                                    class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-line"
                                >
                                    <Icons
                                        name="ScanLine"
                                        :size="28"
                                        class-value="text-signal"
                                    />
                                </div>

                                <h3 class="mt-4 text-sm font-medium text-paper">
                                    Scan a QR code
                                </h3>

                                <p
                                    class="mx-auto mt-1 max-w-[32ch] text-xs leading-relaxed text-ash"
                                >
                                    Scan the QR code provided by your service to
                                    automatically configure your authenticator.
                                </p>

                                <button
                                    type="button"
                                    class="mt-5 inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-xs font-medium text-paper transition-opacity hover:opacity-90"
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

                        <!-- Manual Entry -->
                        <form
                            v-else
                            class="space-y-4"
                            @submit.prevent="addManually"
                        >
                            <div>
                                <label class="mb-1.5 block text-xs text-ash">
                                    Account name
                                </label>

                                <input
                                    v-model="form.name"
                                    type="text"
                                    placeholder="e.g. GitHub"
                                    class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-paper outline-none placeholder:text-ash/50 focus:border-signal"
                                />
                            </div>

                            <div>
                                <label class="mb-1.5 block text-xs text-ash">
                                    Account
                                </label>

                                <input
                                    v-model="form.username"
                                    type="text"
                                    placeholder="e.g. you@example.com"
                                    class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-paper outline-none placeholder:text-ash/50 focus:border-signal"
                                />
                            </div>

                            <div>
                                <label class="mb-1.5 block text-xs text-ash">
                                    Secret key
                                </label>

                                <input
                                    v-model="form.secret"
                                    type="text"
                                    placeholder="JBSWY3DPEHPK3PXP"
                                    autocomplete="off"
                                    class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-sm uppercase text-paper outline-none placeholder:text-ash/50 focus:border-signal"
                                />
                            </div>

                            <button
                                type="submit"
                                class="flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90"
                            >
                                <Icons name="Plus" :size="17" />
                                Add Account
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import Icons from "@/components/common/Icons.vue";

const emit = defineEmits<{
    add: [
        account: {
            name: string;
            username: string;
            secret: string;
        },
    ];
}>();

const open = ref(false);
const tab = ref<"scan" | "manual">("scan");

const form = reactive({
    name: "",
    username: "",
    secret: "",
});

const close = () => {
    open.value = false;
};

const resetForm = () => {
    form.name = "";
    form.username = "";
    form.secret = "";
};

const addManually = () => {
    if (!form.name.trim() || !form.secret.trim()) {
        return;
    }

    emit("add", {
        name: form.name.trim(),
        username: form.username.trim(),
        secret: form.secret.trim().replace(/\s/g, ""),
    });

    resetForm();
    close();
};

const scanCode = () => {
    // Connect your mobile-scanner plugin here.
    console.log("Open native QR scanner");
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
