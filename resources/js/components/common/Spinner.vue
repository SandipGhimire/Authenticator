<template>
    <div
        :class="
            fullscreen
                ? 'flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center'
                : 'inline-flex items-center gap-2'
        "
    >
        <span
            class="spinner-ring shrink-0"
            :style="{ width: `${size}px`, height: `${size}px` }"
            role="status"
            :aria-label="label || 'Loading'"
        />

        <p
            v-if="label"
            :class="
                fullscreen
                    ? 'font-mono text-sm leading-relaxed text-ash'
                    : 'text-xs text-ash'
            "
        >
            {{ label }}
        </p>
    </div>
</template>

<script setup lang="ts">
interface SpinnerProps {
    label?: string;
    size?: number;
    fullscreen?: boolean;
}

withDefaults(defineProps<SpinnerProps>(), {
    label: "",
    size: 28,
    fullscreen: false,
});
</script>

<style scoped>
.spinner-ring {
    display: inline-block;
    border-radius: 9999px;
    border: 3px solid var(--color-line);
    border-top-color: var(--color-signal-bright);
    animation: spinner-rotate 0.8s linear infinite;
}

@keyframes spinner-rotate {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .spinner-ring {
        animation-duration: 1.6s;
    }
}
</style>
