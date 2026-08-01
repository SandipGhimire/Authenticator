<template>
    <header
        class="scan-line sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-panel/95 px-4 backdrop-blur"
        style="
            padding-top: max(env(safe-area-inset-top), 0.75rem);
            padding-bottom: 0.75rem;
        "
    >
        <button
            type="button"
            aria-label="Open menu"
            class="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ash transition-colors hover:bg-panel-2 hover:text-paper active:bg-panel-2"
            @click="$emit('toggle-menu')"
        >
            <Icons name="Menu" :size="20" />
        </button>

        <div class="flex min-w-0 flex-1 items-center gap-2">
            <span
                class="truncate font-display text-[18px] font-semibold tracking-tight text-paper"
                >{{ pageTitle }}</span
            >
        </div>

        <RouterLink
            v-if="profile.settings.multiProfileEnabled && profile.activeProfile"
            :to="{ name: 'profiles' }"
            class="flex shrink-0 items-center gap-2 rounded-full border border-line bg-panel-2 py-1 pr-3 pl-1 transition-colors hover:bg-surface"
            :aria-label="`Switch profile — currently ${profile.activeProfile.name}`"
        >
            <ProfileAvatar
                :name="profile.activeProfile.name"
                :color="profile.activeProfile.color"
                :size="24"
            />
            <span class="max-w-21 truncate text-xs font-medium text-paper">
                {{ profile.activeProfile.name }}
            </span>
        </RouterLink>
    </header>
</template>

<script setup lang="ts">
import Icons from "@/components/common/Icons.vue";
import ProfileAvatar from "@/components/Profiles/ProfileAvatar.vue";
import useApp from "@/store/App/App";
import useProfile from "@/store/Profile/Profile";
import { storeToRefs } from "pinia";

const app = useApp();
const { pageTitle } = storeToRefs(app);
const profile = useProfile();

defineEmits<{ (e: "toggle-menu"): void }>();
</script>
