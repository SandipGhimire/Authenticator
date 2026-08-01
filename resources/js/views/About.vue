<template>
    <div class="flex flex-col gap-8 px-6 py-10">
        <div class="flex flex-col items-center gap-4 text-center">
            <div
                class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl"
            >
                <img
                    :src="iconUrl"
                    alt="Authenticator"
                    class="h-full w-full object-cover"
                />
            </div>

            <div>
                <h1 class="font-display text-lg font-semibold text-paper">
                    Authenticator
                </h1>

                <p class="mt-1 font-mono text-xs text-ash">{{ appVersion }}</p>
            </div>

            <p class="max-w-[50ch] text-sm leading-relaxed text-ash">
                A simple, privacy-focused authenticator for keeping your
                two-factor authentication codes close at hand. Your codes stay
                on your device and are available whenever you need them.
            </p>
        </div>

        <section>
            <h2
                class="mb-3 px-1 font-mono text-xs uppercase tracking-wider text-ash"
            >
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

        <section>
            <h2
                class="mb-3 px-1 font-mono text-xs uppercase tracking-wider text-ash"
            >
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

                        <button
                            type="button"
                            @click="openExternalLink(plugin.url)"
                            :aria-label="`View ${plugin.name} on Packagist`"
                            class="shrink-0 text-ash transition-colors hover:text-signal"
                        >
                            <Icons name="ExternalLink" :size="18" />
                        </button>
                        <button
                            type="button"
                            @click="openLink(plugin.github, plugin.name)"
                            :aria-label="`View ${plugin.name} on Github`"
                            class="shrink-0 text-ash transition-colors hover:text-signal"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink"
                                width="18px"
                                height="18px"
                                viewBox="0 0 20 20"
                                version="1.1"
                            >
                                <g
                                    id="Page-1"
                                    stroke="none"
                                    stroke-width="1"
                                    fill="none"
                                    fill-rule="evenodd"
                                >
                                    <g
                                        id="Dribbble-Light-Preview"
                                        transform="translate(-140.000000, -7559.000000)"
                                        fill="currentColor"
                                    >
                                        <g
                                            id="icons"
                                            transform="translate(56.000000, 160.000000)"
                                        >
                                            <path
                                                d="M94,7399 C99.523,7399 104,7403.59 104,7409.253 C104,7413.782 101.138,7417.624 97.167,7418.981 C96.66,7419.082 96.48,7418.762 96.48,7418.489 C96.48,7418.151 96.492,7417.047 96.492,7415.675 C96.492,7414.719 96.172,7414.095 95.813,7413.777 C98.04,7413.523 100.38,7412.656 100.38,7408.718 C100.38,7407.598 99.992,7406.684 99.35,7405.966 C99.454,7405.707 99.797,7404.664 99.252,7403.252 C99.252,7403.252 98.414,7402.977 96.505,7404.303 C95.706,7404.076 94.85,7403.962 94,7403.958 C93.15,7403.962 92.295,7404.076 91.497,7404.303 C89.586,7402.977 88.746,7403.252 88.746,7403.252 C88.203,7404.664 88.546,7405.707 88.649,7405.966 C88.01,7406.684 87.619,7407.598 87.619,7408.718 C87.619,7412.646 89.954,7413.526 92.175,7413.785 C91.889,7414.041 91.63,7414.493 91.54,7415.156 C90.97,7415.418 89.522,7415.871 88.63,7414.304 C88.63,7414.304 88.101,7413.319 87.097,7413.247 C87.097,7413.247 86.122,7413.234 87.029,7413.87 C87.029,7413.87 87.684,7414.185 88.139,7415.37 C88.139,7415.37 88.726,7417.2 91.508,7416.58 C91.513,7417.437 91.522,7418.245 91.522,7418.489 C91.522,7418.76 91.338,7419.077 90.839,7418.982 C86.865,7417.627 84,7413.783 84,7409.253 C84,7403.59 88.478,7399 94,7399"
                                            ></path>
                                        </g>
                                    </g>
                                </g>
                            </svg>
                        </button>
                    </li>
                </ul>
            </div>
        </section>

        <div class="border-t border-line pt-6 text-center">
            <p class="text-xs text-ash">Designed, developed & maintained by</p>

            <button
                type="button"
                @click="openExternalLink('https://github.com/SandipGhimire/')"
                class="mt-1 inline-block font-mono text-sm text-paper underline decoration-line underline-offset-4 transition-colors hover:text-signal"
            >
                Sandip Ghimire
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import Icons from "@/components/common/Icons.vue";
import iconUrl from "@/assets/icon.png";
import { onMounted } from "vue";
import useApp from "@/store/App/App";
import { Browser } from "@vendor/sghimire/mobile-browser/resources/js/browser.js";
import { appVersion } from "@/main";

const appStore = useApp();

const points = [
    {
        label: "Private by design",
        detail: "Codes are generated locally with the standard TOTP algorithm. Nothing is ever sent to a server — no account to sign into, no cloud sync, no analytics or tracking.",
        icon: "ShieldCheck",
    },
    {
        label: "Biometric-gated vault",
        detail: "Accounts are held in native secure storage behind a biometric unlock, with a fresh check required again for sensitive actions like Settings.",
        icon: "Fingerprint",
    },
    {
        label: "Multiple profiles",
        detail: "Keep more than one independently-secured set of accounts on the same device, with biometric-gated switching between them.",
        icon: "Users",
    },
    {
        label: "Flexible code entry",
        detail: "Add accounts by scanning a QR code or typing the secret by hand, with support for SHA-1/SHA-256/SHA-512 and 6- or 8-digit codes.",
        icon: "ScanLine",
    },
    {
        label: "Google Authenticator migration",
        detail: "Import or export accounts using Google Authenticator's own transfer QR format, with control over exactly which accounts are included.",
        icon: "ArrowRightLeft",
    },
    {
        label: "Encrypted backups",
        detail: "Move your vault between devices with a password-protected, AES-256-GCM encrypted backup file, only your password can unlock it.",
        icon: "DatabaseBackup",
    },
    {
        label: "Native mobile experience",
        detail: "Built with NativePHP and native mobile capabilities for a fast, integrated experience rather than a wrapped web page.",
        icon: "Smartphone",
    },
];

const plugins = [
    {
        name: "Mobile Biometric",
        description: "Native biometric authentication for mobile applications.",
        icon: "Fingerprint",
        url: "https://packagist.org/packages/sghimire/mobile-biometric",
        github: "https://github.com/SandipGhimire/NativePHP-MobileBiometric/",
    },
    {
        name: "Mobile Scanner",
        description: "Native QR and barcode scanning capabilities for mobile.",
        icon: "ScanLine",
        url: "https://packagist.org/packages/sghimire/mobile-scanner",
        github: "https://github.com/SandipGhimire/NativePHP-MobileScanner/",
    },
    {
        name: "Mobile Secure Storage",
        description: "Secure native storage for sensitive application data.",
        icon: "LockKeyhole",
        url: "https://packagist.org/packages/sghimire/mobile-secure-storage",
        github: "https://github.com/SandipGhimire/NativePHP-MobileSecureStorage/",
    },
    {
        name: "Mobile File Access",
        description: "Native file access capabilities for mobile.",
        icon: "File",
        url: "https://packagist.org/packages/sghimire/mobile-file-access",
        github: "https://github.com/SandipGhimire/NativePHP-MobileFileAccess/",
    },
    {
        name: "Mobile Browser",
        description: "Native in-app browser for mobile applications.",
        icon: "Globe",
        url: "https://packagist.org/packages/sghimire/mobile-browser",
        github: "https://github.com/SandipGhimire/NativePHP-MobileBrowser/",
    },
];

async function openLink(url: string, title: string) {
    await Browser.open(url).title("Sandip Ghimire - " + title);
}

async function openExternalLink(url: string) {
    await Browser.open(url).external();
}

onMounted(() => {
    appStore.setTitle("About");
});
</script>
