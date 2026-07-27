<template>
    <div class="relative overflow-hidden rounded-xl">
        <div
            class="absolute inset-y-0 right-0 flex w-20 items-stretch"
            aria-hidden="true"
        >
            <div
                class="flex w-full items-center justify-center bg-red-500 text-paper"
            >
                <Icons name="Trash2" :size="20" />
            </div>
        </div>

        <div
            class="relative touch-pan-y border border-line bg-panel p-4 transition-transform"
            :class="dragging ? 'duration-0' : 'duration-200 ease-out'"
            :style="{ transform: `translateX(${translateX}px)` }"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
        >
            <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <div
                            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface"
                        >
                            <span
                                class="font-display text-sm font-semibold text-signal"
                            >
                                {{ account.name.charAt(0) }}
                            </span>
                        </div>

                        <div class="min-w-0">
                            <p class="truncate text-sm font-medium text-paper">
                                {{ account.name }}
                            </p>

                            <p class="truncate text-xs text-ash">
                                {{ account.username }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="flex shrink-0 items-center gap-1.5">
                    <div
                        class="h-1.5 w-1.5 rounded-full"
                        :class="remaining <= 5 ? 'bg-red-400' : 'bg-signal'"
                    />

                    <span
                        class="font-mono text-[11px]"
                        :class="remaining <= 5 ? 'text-red-400' : 'text-ash'"
                    >
                        {{ remaining }}s
                    </span>
                </div>
            </div>

            <div class="mt-5 flex items-end justify-between">
                <p
                    class="font-mono text-3xl font-semibold tracking-[0.15em] text-paper"
                >
                    {{ code }}
                </p>

                <button
                    type="button"
                    class="rounded-lg p-2 text-ash transition-colors hover:bg-surface hover:text-paper"
                    aria-label="Copy authentication code"
                    @click="copyCode"
                >
                    <Icons name="Copy" :size="17" />
                </button>
            </div>

            <div class="mt-4 h-1 overflow-hidden rounded-full bg-surface">
                <div
                    class="h-full rounded-full transition-all duration-1000"
                    :class="remaining <= 5 ? 'bg-red-400' : 'bg-signal'"
                    :style="{ width: `${progress}%` }"
                />
            </div>
        </div>
    </div>

    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="confirmOpen"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
                @click.self="cancelDelete"
            >
                <div
                    class="w-full max-w-sm rounded-2xl border border-line bg-panel p-5 shadow-2xl"
                >
                    <div
                        class="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10"
                    >
                        <Icons
                            name="Trash2"
                            :size="20"
                            class-value="text-red-500"
                        />
                    </div>

                    <p
                        class="mt-4 font-display text-base font-semibold text-paper"
                    >
                        Delete {{ account.name }}?
                    </p>

                    <p class="mt-1.5 text-sm leading-relaxed text-ash">
                        This will permanently remove this authentication code
                        from your vault. This action cannot be undone, and if
                        you have no other way to generate codes for this
                        account, you may lose access to it.
                    </p>

                    <div class="mt-5 flex gap-3">
                        <button
                            type="button"
                            class="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-paper transition-colors hover:bg-surface disabled:opacity-60"
                            :disabled="deleting"
                            @click="cancelDelete"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            class="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-paper transition-colors active:bg-red-600 disabled:opacity-60"
                            :disabled="deleting"
                            @click="confirmDelete"
                        >
                            {{ deleting ? "Deleting..." : "Delete" }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Icons from "@/components/common/Icons.vue";
import { deleteAccount, StoredAccount } from "@/core/lib/vault";
import { generateCode, remainingSeconds } from "@/core/lib/otp";
import { clockTick } from "@/core/lib/clock";

const props = defineProps<{
    account: StoredAccount;
}>();

const emit = defineEmits<{
    deleted: [id: string];
}>();

const ACTION_WIDTH = 80;

const code = ref("");
const remaining = ref(props.account.period);

const progress = computed(() => {
    return (remaining.value / props.account.period) * 100;
});

watch(
    clockTick,
    () => {
        remaining.value = remainingSeconds(props.account.period);
        code.value = generateCode(props.account);
    },
    { immediate: true },
);

const copyCode = async () => {
    await navigator.clipboard.writeText(code.value.replace(/\s/g, ""));
};

const translateX = ref(0);
const dragging = ref(false);

let pointerId: number | null = null;
let startX = 0;
let startY = 0;
let startTranslate = 0;
let axis: "x" | "y" | null = null;

const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
        return;
    }

    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startTranslate = translateX.value;
    axis = null;
    dragging.value = true;
};

const onPointerMove = (event: PointerEvent) => {
    if (!dragging.value || event.pointerId !== pointerId) {
        return;
    }

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (axis === null) {
        if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) {
            return;
        }

        axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";

        if (axis === "x") {
            (event.target as Element).setPointerCapture(pointerId);
        }
    }

    if (axis !== "x") {
        return;
    }

    event.preventDefault();
    translateX.value = Math.min(
        0,
        Math.max(-ACTION_WIDTH, startTranslate + deltaX),
    );
};

// Must match the card's "duration-200" transition class above, so the
// confirm dialog only appears once the row has visibly slid shut.
const CLOSE_TRANSITION_MS = 200;

const endDrag = () => {
    dragging.value = false;
    pointerId = null;

    if (axis === "x") {
        const fullySwiped = translateX.value <= -ACTION_WIDTH;
        translateX.value = 0;

        if (fullySwiped) {
            window.setTimeout(openConfirm, CLOSE_TRANSITION_MS);
        }
    }

    axis = null;
};

const onPointerUp = () => {
    endDrag();
};

const confirmOpen = ref(false);
const deleting = ref(false);

const openConfirm = () => {
    confirmOpen.value = true;
};

const cancelDelete = () => {
    if (deleting.value) {
        return;
    }

    confirmOpen.value = false;
};

const confirmDelete = async () => {
    deleting.value = true;
    await deleteAccount(props.account.id);
    deleting.value = false;
    confirmOpen.value = false;
    emit("deleted", props.account.id);
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
