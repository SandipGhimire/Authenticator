<template>
    <div ref="rootEl">
        <div
            class="flex items-center justify-center overflow-hidden"
            :style="{
                height: `${pullDistance}px`,
                transition: dragging ? 'none' : 'height 200ms ease-out',
            }"
        >
            <div
                class="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel text-signal"
                :style="{
                    opacity: Math.min(pullDistance / threshold, 1),
                    transform: `rotate(${rotation}deg)`,
                }"
            >
                <Icons
                    name="RefreshCw"
                    :size="16"
                    :class-value="refreshing ? 'animate-spin' : ''"
                />
            </div>
        </div>

        <div
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            @touchcancel="onTouchCancel"
        >
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Icons from "@/components/common/Icons.vue";

const props = withDefaults(
    defineProps<{
        onRefresh: () => Promise<void> | void;
        threshold?: number;
        maxPull?: number;
    }>(),
    {
        threshold: 64,
        maxPull: 96,
    },
);

const rootEl = ref<HTMLElement | null>(null);
const pullDistance = ref(0);
const dragging = ref(false);
const refreshing = ref(false);
const rotation = ref(0);

let startY = 0;
let scrollParent: HTMLElement | null = null;

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
    let node = el?.parentElement ?? null;

    while (node) {
        if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) {
            return node;
        }
        node = node.parentElement;
    }

    return document.scrollingElement as HTMLElement | null;
}

function onTouchStart(event: TouchEvent) {
    if (refreshing.value) return;

    const parent = findScrollParent(rootEl.value);
    if (!parent || parent.scrollTop > 0) return;

    scrollParent = parent;
    startY = event.touches[0].clientY;
    dragging.value = true;
}

function onTouchMove(event: TouchEvent) {
    if (!dragging.value || !scrollParent) return;

    const delta = event.touches[0].clientY - startY;

    if (delta <= 0) {
        pullDistance.value = 0;
        return;
    }

    pullDistance.value = Math.min(props.maxPull, delta * 0.45);
    rotation.value = (pullDistance.value / props.threshold) * 360;
    event.preventDefault();
}

async function onTouchEnd() {
    if (!dragging.value) return;

    dragging.value = false;
    scrollParent = null;

    if (pullDistance.value < props.threshold) {
        pullDistance.value = 0;
        return;
    }

    refreshing.value = true;
    pullDistance.value = props.threshold * 0.8;

    try {
        await props.onRefresh();
    } finally {
        refreshing.value = false;
        pullDistance.value = 0;
    }
}

function onTouchCancel() {
    dragging.value = false;
    scrollParent = null;
    pullDistance.value = 0;
}
</script>
