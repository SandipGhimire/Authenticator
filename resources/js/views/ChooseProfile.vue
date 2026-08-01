<template>
    <div class="flex min-h-dvh w-full flex-col bg-ink px-6 py-10">
        <div class="flex flex-1 flex-col items-center justify-center">
            <div class="w-full max-w-sm">
                <div class="text-center">
                    <p
                        class="font-mono text-[14px] uppercase tracking-[0.2em] text-ash"
                    >
                        Secure Access
                    </p>

                    <h1
                        class="mt-2 font-display text-2xl font-semibold text-paper"
                    >
                        Choose a profile
                    </h1>

                    <p
                        class="mx-auto mt-3 max-w-[36ch] text-sm leading-relaxed text-ash"
                    >
                        Pick which profile's codes you want to open.
                    </p>
                </div>

                <div class="mt-8 space-y-2">
                    <button
                        v-for="profile in profileStore.profiles"
                        :key="profile.id"
                        type="button"
                        class="flex w-full items-center gap-3 rounded-xl border border-line bg-panel p-4 text-left transition-colors hover:bg-panel-2 disabled:opacity-60"
                        :disabled="switching !== null"
                        @click="choose(profile.id)"
                    >
                        <ProfileAvatar
                            :name="profile.name"
                            :color="profile.color"
                            :size="40"
                        />

                        <span
                            class="min-w-0 flex-1 truncate text-sm font-medium text-paper"
                        >
                            {{ profile.name }}
                        </span>

                        <Spinner v-if="switching === profile.id" :size="18" />
                        <Icons
                            v-else
                            name="ChevronRight"
                            :size="18"
                            class-value="text-ash"
                        />
                    </button>
                </div>

                <p
                    v-if="error"
                    class="mt-4 text-center text-xs leading-relaxed text-red-500/90"
                >
                    {{ error }}
                </p>

                <div class="mt-8 text-center">
                    <button
                        type="button"
                        class="font-mono text-xs text-ash underline underline-offset-4"
                        @click="appStore.logout"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import Icons from "@/components/common/Icons.vue";
import Spinner from "@/components/common/Spinner.vue";
import ProfileAvatar from "@/components/Profiles/ProfileAvatar.vue";
import useApp from "@/store/App/App";
import useProfile from "@/store/Profile/Profile";

const router = useRouter();
const appStore = useApp();
const profileStore = useProfile();

const switching = ref<string | null>(null);
const error = ref("");

const choose = async (id: string) => {
    error.value = "";
    switching.value = id;

    try {
        const ok = await profileStore.switchTo(id);

        if (ok) {
            await router.replace({ name: "home" });
        } else {
            error.value = "Authentication was cancelled.";
        }
    } catch {
        error.value = "Something went wrong while switching profiles.";
    } finally {
        switching.value = null;
    }
};
</script>
