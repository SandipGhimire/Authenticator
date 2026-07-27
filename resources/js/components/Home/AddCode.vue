<template>
    <button
        type="button"
        class="fixed right-6 bottom-[100px] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-signal text-paper shadow-lg transition-transform active:scale-95"
        aria-label="Add authentication code"
        @click="open = true"
    >
        <Icons name="Plus" :size="24" />
    </button>

    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="open"
                class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4"
            >
                <div
                    class="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
                >
                    <div
                        class="flex items-center justify-between border-b border-line px-5 py-4"
                    >
                        <div>
                            <p
                                class="font-display text-base font-semibold text-paper"
                            >
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

                    <div class="p-5">
                        <QRCode v-if="tab === 'scan'"></QRCode>
                        <ManualEntry v-else></ManualEntry>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Icons from "@/components/common/Icons.vue";
import QRCode from "./AddCode/QRCode.vue";
import ManualEntry from "./AddCode/ManualEntry.vue";

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

const close = () => {
    open.value = false;
    tab.value = "scan";
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
