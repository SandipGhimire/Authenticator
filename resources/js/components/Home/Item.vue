<template>
    <div class="relative overflow-hidden rounded-lg border border-line">
        <div
            class="absolute inset-y-0 right-0 flex w-20 items-stretch"
            aria-hidden="true"
        >
            <div
                class="flex w-full items-center justify-center bg-red-500 text-paper rounded-r-lg"
            >
                <Icons name="Trash2" :size="20" />
            </div>
        </div>

        <div
            class="relative -mr-px touch-pan-y bg-panel p-3.5 transition-transform"
            :class="dragging ? 'duration-0' : 'duration-200 ease-out'"
            :style="{ transform: `translateX(${translateX}px)` }"
            aria-label="Copy authentication code"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @click="copyCode"
        >
            <div class="flex items-center justify-between gap-3">
                <div>
                    <div class="flex min-w-0 items-center gap-2.5">
                        <div class="min-w-0">
                            <p class="truncate text-ash">
                                <span class="font-medium"
                                    >{{ account.name }}: </span
                                >{{ account.username }}
                            </p>
                        </div>
                    </div>
                    <div
                        class="text-3xl font-semibold tracking-[0.12em] text-paper mt-1"
                    >
                        {{ code }}
                    </div>
                </div>

                <div class="relative flex h-10 w-10">
                    <svg viewBox="0 0 32 32" class="-rotate-90">
                        <circle
                            cx="16"
                            cy="16"
                            r="13"
                            fill="none"
                            stroke-width="2"
                            class="stroke-surface"
                        />
                        <circle
                            cx="16"
                            cy="16"
                            r="13"
                            fill="none"
                            stroke-width="3"
                            class="stroke-current transition-all duration-100 ease-linear"
                            :class="
                                remaining <= 5 ? 'text-red-400' : 'text-signal'
                            "
                            :stroke-dasharray="circumference"
                            :stroke-dashoffset="dashOffset"
                        />
                    </svg>

                    <div
                        class="absolute h-10 w-10 flex justify-center items-center"
                    >
                        <Transition name="fade" mode="out-in">
                            <Icons
                                v-if="copied"
                                key="check"
                                name="Check"
                                :size="16"
                                :stroke-width="4"
                                class-value="text-green-600"
                            />
                            <span
                                v-else
                                key="secs"
                                class="font-mono text-[14px] tabular-nums"
                                :class="
                                    remaining <= 5 ? 'text-red-400' : 'text-ash'
                                "
                            >
                                {{ remaining }}
                            </span>
                        </Transition>
                    </div>
                </div>
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
                            class="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-paper transition-colors active:bg-red-500 disabled:opacity-60"
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

const RADIUS = 13;
const circumference = 2 * Math.PI * RADIUS;

const dashOffset = computed(() => {
    const progress = remaining.value / props.account.period;
    return circumference * (1 - progress);
});

watch(
    clockTick,
    () => {
        remaining.value = remainingSeconds(props.account.period);
        code.value = generateCode(props.account);
    },
    { immediate: true },
);

const copied = ref(false);
let copiedTimeout: ReturnType<typeof window.setTimeout> | null | number = null;

const copyCode = async () => {
    await navigator.clipboard.writeText(code.value.replace(/\s/g, ""));

    copied.value = true;

    if (copiedTimeout) {
        window.clearTimeout(copiedTimeout);
    }

    copiedTimeout = window.setTimeout(() => {
        copied.value = false;
    }, 1200);
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
    transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
