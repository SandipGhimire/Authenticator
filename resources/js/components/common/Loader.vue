<template>
    <Transition name="loader-fade">
        <div
            v-if="show"
            class="pointer-events-none relative z-20 w-full"
            role="status"
            aria-live="polite"
            :aria-label="label"
        >
            <div class="h-[3px] w-full overflow-hidden bg-line/40">
                <div
                    class="loader-bar h-full w-1/3 rounded-full bg-signal-bright"
                />
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
interface LoaderProps {
    show?: boolean;
    label?: string;
}

withDefaults(defineProps<LoaderProps>(), {
    show: false,
    label: "Loading",
});
</script>

<style scoped>
.loader-bar {
    animation: loader-slide 1.1s ease-in-out infinite;
}

@keyframes loader-slide {
    0% {
        transform: translateX(-100%);
    }
    50% {
        transform: translateX(150%);
    }
    100% {
        transform: translateX(350%);
    }
}

.loader-fade-enter-active,
.loader-fade-leave-active {
    transition: opacity 0.2s ease;
}
.loader-fade-enter-from,
.loader-fade-leave-to {
    opacity: 0;
}
</style>
