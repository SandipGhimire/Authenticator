<template>
    <div class="min-h-full px-6 py-6 pb-28">
        <div
            v-if="!unlocked"
            class="flex min-h-[60vh] flex-col items-center justify-center text-center"
        >
            <div
                class="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-panel"
            >
                <Icons
                    name="LockKeyhole"
                    :size="26"
                    class-value="text-signal"
                />
            </div>

            <p class="mt-4 text-sm font-medium text-paper">Verify it's you</p>

            <p class="mt-1 max-w-[36ch] text-xs leading-relaxed text-ash">
                Settings control your biometric requirements, so we need to
                confirm it's you before you can change anything.
            </p>

            <Spinner v-if="checking" class="mt-6" :size="24" />

            <button
                v-else
                type="button"
                class="mt-6 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
                @click="unlock"
            >
                Try again
            </button>
        </div>

        <div v-else class="space-y-4">
            <section class="rounded-xl border border-line bg-panel p-5">
                <p class="text-sm font-medium text-paper">Profiles</p>

                <p class="mt-1 text-xs leading-relaxed text-ash">
                    Control how multiple separate vaults behave on this device.
                </p>

                <div class="mt-5 space-y-5">
                    <div
                        v-for="item in toggles"
                        :key="item.key"
                        class="flex items-start justify-between gap-4"
                    >
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-paper">
                                {{ item.label }}
                            </p>
                            <p class="mt-0.5 text-xs leading-relaxed text-ash">
                                {{ item.description }}
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            :aria-checked="isOn(item.key)"
                            :aria-label="item.label"
                            class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                            :class="isOn(item.key) ? 'bg-signal' : 'bg-surface'"
                            @click="toggle(item.key)"
                        >
                            <span
                                class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-paper transition-transform"
                                :class="
                                    isOn(item.key)
                                        ? 'translate-x-5'
                                        : 'translate-x-0'
                                "
                            />
                        </button>
                    </div>

                    <div>
                        <label class="mb-1.5 block text-xs text-ash">
                            Always boot into
                        </label>

                        <select v-model="bootProfileId">
                            <option :value="null">
                                Ask / remember last used
                            </option>
                            <option
                                v-for="profile in profileStore.profiles"
                                :key="profile.id"
                                :value="profile.id"
                            >
                                {{ profile.name }}
                            </option>
                        </select>
                    </div>
                </div>
            </section>

            <RouterLink
                :to="{ name: 'profiles' }"
                class="flex items-center justify-between rounded-xl border border-line bg-panel p-5 text-sm font-medium text-paper transition-colors hover:bg-panel-2"
            >
                Manage profiles
                <Icons name="ChevronRight" :size="18" class-value="text-ash" />
            </RouterLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import Icons from "@/components/common/Icons.vue";
import Spinner from "@/components/common/Spinner.vue";
import useApp from "@/store/App/App";
import useProfile from "@/store/Profile/Profile";
import { requestBiometric } from "@/core/lib/biometricGate";
import type { AppSettings } from "@/core/lib/settings";

type ToggleKey =
    | "multiProfileEnabled"
    | "rememberLastProfile"
    | "requireBiometricOnSwitch"
    | "requireBiometricOnDelete";

const toggles: { key: ToggleKey; label: string; description: string }[] = [
    {
        key: "multiProfileEnabled",
        label: "Enable profile switching",
        description:
            "Show the profile switcher and let this device hold more than one vault.",
    },
    {
        key: "rememberLastProfile",
        label: "Remember last profile",
        description: "Reopen into the profile you were last using.",
    },
    {
        key: "requireBiometricOnSwitch",
        label: "Require biometrics to switch",
        description: "Confirm it's you every time you switch profiles.",
    },
    {
        key: "requireBiometricOnDelete",
        label: "Require biometrics to delete",
        description:
            "Confirm it's you before a profile and its codes are permanently deleted.",
    },
];

const appStore = useApp();
const profileStore = useProfile();

const unlocked = ref(false);
const checking = ref(false);

const unlock = async () => {
    checking.value = true;

    const ok = await requestBiometric({
        id: "settings-unlock",
        title: "Unlock Settings",
        subtitle: "Confirm it's you to change app settings",
        allowDeviceCredential: true,
    });

    checking.value = false;
    unlocked.value = ok;
};

const isOn = (key: ToggleKey) => Boolean(profileStore.settings[key]);

const toggle = async (key: ToggleKey) => {
    await profileStore.updateSettings({
        [key]: !profileStore.settings[key],
    } as Partial<AppSettings>);
};

const bootProfileId = computed<string | null>({
    get: () => profileStore.settings.bootProfileId,
    set: (value) => {
        profileStore.updateSettings({ bootProfileId: value });
    },
});

onMounted(async () => {
    appStore.setTitle("Settings");
    await profileStore.refreshProfiles();
    await unlock();
});
</script>
