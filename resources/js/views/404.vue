<template>
    <div
        class="relative flex min-h-full w-full flex-col items-center justify-center overflow-hidden px-6 py-10"
    >
        <div
            class="pointer-events-none absolute inset-0 opacity-[0.025]"
            style="
                background-image:
                    linear-gradient(
                        rgba(255, 255, 255, 0.8) 1px,
                        transparent 1px
                    ),
                    linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0.8) 1px,
                        transparent 1px
                    );
                background-size: 32px 32px;
            "
        />

        <main
            class="relative z-10 flex w-full max-w-sm flex-col items-center text-center"
        >
            <div class="space-y-3">
                <p
                    class="font-mono text-[10px] uppercase tracking-[0.25em] text-ash"
                >
                    Vault signal lost
                </p>

                <h1
                    class="font-display text-2xl font-semibold tracking-tight text-paper"
                >
                    This page doesn't exist.
                </h1>

                <p
                    class="mx-auto max-w-[40ch] text-sm leading-relaxed text-ash"
                >
                    The route you're looking for couldn't be found. Your
                    authentication vault is still safe on this device.
                </p>
            </div>

            <div
                class="mt-8 w-full rounded-xl border border-line bg-panel p-4 text-left"
            >
                <div class="mb-3 flex items-center gap-2">
                    <span class="h-1.5 w-1.5 rounded-full bg-red-400" />
                    <span class="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                    <span class="h-1.5 w-1.5 rounded-full bg-signal" />
                </div>

                <div class="space-y-1 font-mono text-[10px]">
                    <p class="text-ash">
                        <span class="text-signal">status</span>
                        :: 404
                    </p>

                    <p class="text-ash">
                        <span class="text-signal">route</span>
                        :: not_found
                    </p>

                    <p class="text-ash">
                        <span class="text-signal">vault</span>
                        ::
                        <span class="text-signal">secure</span>
                    </p>
                </div>
            </div>

            <button
                type="button"
                class="mt-6 inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-5 py-3 text-sm font-medium text-paper transition-all hover:border-signal hover:text-signal active:scale-[0.98]"
                @click="goHome"
            >
                <Icons name="ArrowLeft" :size="16" />
                Return to vault
            </button>

            <p class="mt-8 font-mono text-[10px] text-ash">
                Nothing was lost. Except this route.
            </p>
        </main>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import Icons from "@/components/common/Icons.vue";

const router = useRouter();

const goHome = () => {
    router.push("/user/home");
};
</script>

<style scoped>
@keyframes scan {
    0%,
    100% {
        transform: translateY(-32px);
        opacity: 0;
    }

    15% {
        opacity: 0.8;
    }

    50% {
        opacity: 1;
    }

    85% {
        opacity: 0.8;
    }

    100% {
        transform: translateY(32px);
        opacity: 0;
    }
}

.animate-scan {
    animation: scan 2.4s ease-in-out infinite;
}

@keyframes pulse-ring {
    0% {
        transform: scale(0.92);
        opacity: 0;
    }

    30% {
        opacity: 0.6;
    }

    70%,
    100% {
        transform: scale(1.12);
        opacity: 0;
    }
}

.animate-pulse-ring {
    animation: pulse-ring 3s ease-out infinite;
}

@keyframes pulse-ring-delayed {
    0%,
    25% {
        transform: scale(0.92);
        opacity: 0;
    }

    50% {
        opacity: 0.4;
    }

    80%,
    100% {
        transform: scale(1.12);
        opacity: 0;
    }
}

.animate-pulse-ring-delayed {
    animation: pulse-ring-delayed 3s ease-out infinite;
}
</style>
