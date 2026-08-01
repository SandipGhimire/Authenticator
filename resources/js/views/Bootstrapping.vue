<template>
    <div class="flex min-h-dvh w-full flex-col bg-ink">
        <Spinner v-if="!error" fullscreen label="" :size="36" />

        <div
            v-else
            class="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center"
        >
            <p class="max-w-[36ch] text-sm leading-relaxed text-ash">
                {{ error }}
            </p>

            <button
                type="button"
                class="rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
                @click="start"
            >
                Try again
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Spinner from "@/components/common/Spinner.vue";
import useProfile from "@/store/Profile/Profile";

const router = useRouter();
const profileStore = useProfile();

const error = ref("");

const start = async () => {
    error.value = "";

    try {
        await profileStore.bootstrap();

        await router.replace({
            name: profileStore.activeProfileId ? "home" : "choose-profile",
        });
    } catch {
        error.value =
            "Something went wrong while setting up your vault. Your codes are safe — please try again.";
    }
};

onMounted(start);
</script>
