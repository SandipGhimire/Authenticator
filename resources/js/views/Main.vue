<template>
    <div
        class="flex min-h-full w-full flex-col items-center justify-center px-6 py-10"
    >
        <div class="text-center">
            <p
                class="font-mono text-[14px] uppercase tracking-[0.2em] text-ash"
            >
                Secure Access
            </p>

            <h1 class="mt-2 font-display text-3xl font-semibold text-paper">
                Unlock your vault
            </h1>

            <p
                class="mx-auto mt-3 max-w-[40ch] text-sm leading-relaxed text-ash"
            >
                Use your device biometric authentication to securely access your
                stored authentication codes.
            </p>
        </div>

        <div class="relative mt-12">
            <div
                class="absolute inset-0 scale-100 rounded-full border border-signal/20 animate-biometric-pulse"
            />

            <div
                class="absolute inset-[-18px] rounded-full border border-signal/10 animate-biometric-pulse-delayed"
            />
            <button
                type="button"
                class="relative flex h-36 w-36 items-center justify-center rounded-full border border-line bg-panel shadow-xl transition-all duration-300 active:scale-95"
                :class="{
                    'border-green-500': status === 'success',
                    'border-red-400': status === 'failed',
                    'animate-biometric-shake': status === 'failed',
                }"
                aria-label="Authenticate with biometrics"
                @click="appStore.authenticate"
            >
                <div
                    v-if="status === 'success'"
                    class="absolute inset-2 rounded-full border border-green-500 animate-success-ring"
                />

                <div
                    v-if="status === 'failed'"
                    class="absolute inset-2 rounded-full border border-red-400 animate-failure-ring"
                />

                <Transition name="icon-switch" mode="out-in">
                    <Icons
                        key="fingerprint"
                        :name="
                            status === 'success'
                                ? 'Check'
                                : status === 'failed'
                                  ? 'X'
                                  : 'Fingerprint'
                        "
                        :size="72"
                        :class-value="
                            status === 'success'
                                ? 'text-green-500'
                                : status === 'failed'
                                  ? 'text-red-400'
                                  : 'text-signal'
                        "
                    />
                </Transition>
            </button>
        </div>

        <Transition name="message" mode="out-in">
            <div
                v-if="status === 'success'"
                key="success"
                class="mt-8 text-center"
            >
                <p class="text-lg font-medium text-green-500">
                    Authentication successful
                </p>

                <p class="mt-1 text-sm text-ash">
                    Your vault has been unlocked.
                </p>
            </div>

            <div
                v-else-if="status === 'failed'"
                key="failed"
                class="mt-8 text-center"
            >
                <p class="text-lg font-medium text-red-400">
                    Authentication failed
                </p>

                <p class="mt-1 text-sm text-ash">
                    Biometric verification was not successful.
                </p>
            </div>

            <div v-else key="idle" class="mt-8 text-center">
                <p class="text-lg font-medium text-paper">
                    Tap to authenticate
                </p>

                <p class="mt-1 font-mono text-sm text-ash">
                    Your biometric data never leaves your device.
                </p>
            </div>
        </Transition>

        <div v-if="isPC" class="mt-8 text-center">
            <button
                type="button"
                @click="handleCompleted({ success: true })"
                class="font-mono text-sm text-ash border border-ash rounded px-2 py-1"
            >
                Login Bypass
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Icons from "@/components/common/Icons.vue";
import {
    On,
    Off,
    Events,
} from "@vendor/sghimire/mobile-biometric/resources/js/biometric.js";
import useApp from "@/store/App/App";
import { useRoute } from "vue-router";

type AuthenticationStatus = "idle" | "success" | "failed";

const appStore = useApp();
const route = useRoute();

const status = ref<AuthenticationStatus>("idle");

const isPC = ref(false);

let resetTimer: ReturnType<typeof setTimeout> | null = null;

const resetAfter = (duration = 1800) => {
    if (resetTimer) {
        clearTimeout(resetTimer);
    }

    resetTimer = setTimeout(() => {
        status.value = "idle";
    }, duration);
};

onMounted(() => {
    On(Events.Biometric.Completed, handleCompleted);
    if (route.query.pc == "1") {
        isPC.value = true;
    }
});

onUnmounted(() => Off(Events.Biometric.Completed, handleCompleted));

const handleCompleted = (isSuccess: { success: boolean }) => {
    status.value = isSuccess.success ? "success" : "failed";
    if (isSuccess.success) {
        setTimeout(() => {
            appStore.successLogin();
        }, 1000);
    }
    resetAfter();
};
</script>

<style scoped>
@keyframes biometric-pulse {
    0%,
    100% {
        transform: scale(0.9);
        opacity: 0;
    }

    35% {
        opacity: 1;
    }

    70% {
        transform: scale(1.25);
        opacity: 0;
    }
}

@keyframes biometric-pulse-delayed {
    0%,
    25% {
        transform: scale(0.9);
        opacity: 0;
    }

    50% {
        opacity: 1;
    }

    85% {
        transform: scale(1.25);
        opacity: 0;
    }

    100% {
        opacity: 0;
    }
}

.animate-biometric-pulse {
    animation: biometric-pulse 2.4s ease-out infinite;
}

.animate-biometric-pulse-delayed {
    animation: biometric-pulse-delayed 2.4s ease-out infinite;
}

/*
 * Fingerprint breathing animation
 */
@keyframes fingerprint {
    0%,
    100% {
        transform: scale(1);
        opacity: 0.75;
    }

    50% {
        transform: scale(1.06);
        opacity: 1;
    }
}

.animate-fingerprint {
    animation: fingerprint 1.8s ease-in-out infinite;
}

/*
 * Success
 */
@keyframes success-ring {
    0% {
        transform: scale(0.7);
        opacity: 0;
    }

    50% {
        transform: scale(1);
        opacity: 1;
    }

    100% {
        transform: scale(1.08);
        opacity: 0;
    }
}

.animate-success-ring {
    animation: success-ring 0.6s ease-out forwards;
}

/*
 * Failure
 */
@keyframes failure-ring {
    0% {
        transform: scale(0.7);
        opacity: 0;
    }

    50% {
        transform: scale(1);
        opacity: 1;
    }

    100% {
        transform: scale(1.08);
        opacity: 0;
    }
}

.animate-failure-ring {
    animation: failure-ring 0.6s ease-out forwards;
}

@keyframes biometric-shake {
    0%,
    100% {
        transform: translateX(0);
    }

    20% {
        transform: translateX(-7px);
    }

    40% {
        transform: translateX(7px);
    }

    60% {
        transform: translateX(-5px);
    }

    80% {
        transform: translateX(5px);
    }
}

.animate-biometric-shake {
    animation: biometric-shake 0.45s ease-in-out;
}

/*
 * Icon transition
 */
.icon-switch-enter-active,
.icon-switch-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

.icon-switch-enter-from {
    opacity: 0;
    transform: scale(0.6);
}

.icon-switch-leave-to {
    opacity: 0;
    transform: scale(1.3);
}

/*
 * Message transition
 */
.message-enter-active,
.message-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

.message-enter-from {
    opacity: 0;
    transform: translateY(5px);
}

.message-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}
</style>
