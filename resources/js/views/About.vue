<template>
    <div class="flex flex-col gap-8 px-6 py-10">
        <!-- App Header -->
        <div class="flex flex-col items-center gap-4 text-center">
            <div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl">
                <img :src="iconUrl" alt="Authenticator" class="h-full w-full object-cover" />
            </div>

            <div>
                <h1 class="font-display text-lg font-semibold text-paper">
                    Authenticator
                </h1>

                <p class="mt-1 font-mono text-xs text-ash">
                    v1.0.0
                </p>
            </div>

            <p class="max-w-[50ch] text-sm leading-relaxed text-ash">
                A simple, privacy-focused authenticator for keeping your
                two-factor authentication codes close at hand. Your codes
                stay on your device and are available whenever you need them.
            </p>
        </div>

        <!-- Features -->
        <section>
            <h2 class="mb-3 px-1 font-mono text-xs uppercase tracking-wider text-ash">
                Features
            </h2>

            <ul class="space-y-3 rounded-xl border border-line bg-panel p-4">
                <li
                    v-for="point in points"
                    :key="point.label"
                    class="flex items-start gap-3"
                >
                    <Icons
                        :name="point.icon"
                        :size="18"
                        class-value="mt-0.5 shrink-0 text-signal"
                    />

                    <div class="min-w-0">
                        <p class="text-sm font-medium text-paper">
                            {{ point.label }}
                        </p>

                        <p class="mt-0.5 text-xs leading-relaxed text-ash">
                            {{ point.detail }}
                        </p>
                    </div>
                </li>
            </ul>
        </section>

        <!-- Built With -->
        <section>
            <h2 class="mb-3 px-1 font-mono text-xs uppercase tracking-wider text-ash">
                Built with NativePHP
            </h2>

            <div class="rounded-xl border border-line bg-panel p-4">
                <p class="mb-4 text-sm leading-relaxed text-ash">
                    This application is built with NativePHP and uses
                    mobile-focused plugins created and maintained by me to
                    bridge native device capabilities with the application.
                </p>

                <ul class="space-y-3">
                    <li
                        v-for="plugin in plugins"
                        :key="plugin.name"
                        class="flex items-center gap-3"
                    >
                        <div
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface"
                        >
                            <Icons
                                :name="plugin.icon"
                                :size="17"
                                class-value="text-signal"
                            />
                        </div>

                        <div class="min-w-0 flex-1">
                            <p class="text-sm font-medium text-paper">
                                {{ plugin.name }}
                            </p>

                            <p class="text-xs text-ash">
                                {{ plugin.description }}
                            </p>
                        </div>

                        <a
                            :href="plugin.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            :aria-label="`View ${plugin.name} on Packagist`"
                            class="shrink-0 text-ash transition-colors hover:text-signal"
                        >
                            <Icons name="ExternalLink" :size="15" />
                        </a>
                    </li>
                </ul>
            </div>
        </section>

        <!-- Developer -->
        <div class="border-t border-line pt-6 text-center">
            <p class="text-xs text-ash">
                Designed, developed & maintained by
            </p>

            <a
                href="https://github.com/SandipGhimire/"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-1 inline-block font-mono text-sm text-paper underline decoration-line underline-offset-4 transition-colors hover:text-signal"
            >
                Sandip Ghimire
            </a>
        </div>
    </div>
</template>

<script setup lang="ts">
import Icons from "@/components/common/Icons.vue";
import iconUrl from "@/assets/icon.png";
import { onMounted } from "vue";
import useApp from "@/store/App/App";

const appStore = useApp();

const points = [
    {
        label: "Private by design",
        detail: "Your authentication codes are stored locally on your device and are not uploaded to a remote server.",
        icon: "ShieldCheck",
    },
    {
        label: "No accounts or tracking",
        detail: "No registration, cloud account, analytics, or unnecessary tracking. The app stays focused on your codes.",
        icon: "EyeOff",
    },
    {
        label: "Quick access",
        detail: "A focused, dark interface designed for fast access when you need a verification code.",
        icon: "Zap",
    },
    {
        label: "Native mobile features",
        detail: "Built with NativePHP and native mobile capabilities for a more integrated experience.",
        icon: "Smartphone",
    },
];

const plugins = [
    {
        name: "Mobile Biometric",
        description: "Native biometric authentication for mobile applications.",
        icon: "Fingerprint",
        url: "https://packagist.org/packages/sghimire/mobile-biometric",
    },
    {
        name: "Mobile Scanner",
        description: "Native QR and barcode scanning capabilities for mobile.",
        icon: "ScanLine",
        url: "https://packagist.org/packages/sghimire/mobile-scanner",
    },
    {
        name: "Mobile Secure Storage",
        description: "Secure native storage for sensitive application data.",
        icon: "LockKeyhole",
        url: "https://packagist.org/packages/sghimire/mobile-secure-storage",
    },
];

onMounted(() => {
    appStore.setTitle("About");
})
</script>
