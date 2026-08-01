<template>
    <div class="relative min-h-full px-6 py-6 pb-28">
        <section class="mb-6">
            <h2
                class="mb-3 px-1 font-mono text-xs uppercase tracking-wider text-ash"
            >
                Current
            </h2>

            <div
                v-if="profileStore.activeProfile"
                class="flex items-center gap-3 rounded-xl border border-signal/30 bg-panel p-4"
            >
                <ProfileAvatar
                    :name="profileStore.activeProfile.name"
                    :color="profileStore.activeProfile.color"
                    :size="44"
                />

                <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-paper">
                        {{ profileStore.activeProfile.name }}
                    </p>
                    <p class="text-xs text-ash">Active now</p>
                </div>

                <button
                    type="button"
                    class="rounded-lg p-2 text-ash transition-colors hover:bg-surface hover:text-paper"
                    aria-label="Rename profile"
                    @click="startRename(profileStore.activeProfile)"
                >
                    <Icons name="PenLine" :size="17" />
                </button>
            </div>
        </section>

        <section v-if="otherProfiles.length">
            <h2
                class="mb-3 px-1 font-mono text-xs uppercase tracking-wider text-ash"
            >
                Switch to
            </h2>

            <div class="space-y-2">
                <div
                    v-for="profile in otherProfiles"
                    :key="profile.id"
                    class="flex items-center gap-1 rounded-xl border border-line bg-panel p-2 pl-4"
                >
                    <button
                        type="button"
                        class="flex min-w-0 flex-1 items-center gap-3 py-2 text-left disabled:opacity-60"
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

                        <Spinner v-if="switching === profile.id" :size="16" />
                    </button>

                    <button
                        type="button"
                        class="shrink-0 rounded-lg p-2 text-ash transition-colors hover:bg-surface hover:text-paper"
                        aria-label="Rename profile"
                        @click="startRename(profile)"
                    >
                        <Icons name="PenLine" :size="17" />
                    </button>

                    <button
                        type="button"
                        class="shrink-0 rounded-lg p-2 text-ash transition-colors hover:bg-red-500/10 hover:text-red-500"
                        aria-label="Delete profile"
                        @click="startDelete(profile)"
                    >
                        <Icons name="Trash2" :size="17" />
                    </button>
                </div>
            </div>
        </section>

        <p
            v-if="error"
            class="mt-4 text-center text-xs leading-relaxed text-red-500/90"
        >
            {{ error }}
        </p>

        <button
            type="button"
            class="fixed right-6 bottom-[100px] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-signal text-paper shadow-lg transition-transform active:scale-95"
            aria-label="Add profile"
            @click="startCreate"
        >
            <Icons name="Plus" :size="24" />
        </button>

        <ProfileForm
            v-model="formOpen"
            :mode="formMode"
            :profile="formProfile"
        />

        <DeleteProfileConfirm v-model="deleteOpen" :profile="deleteTarget" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Icons from "@/components/common/Icons.vue";
import Spinner from "@/components/common/Spinner.vue";
import ProfileAvatar from "@/components/Profiles/ProfileAvatar.vue";
import ProfileForm from "@/components/Profiles/ProfileForm.vue";
import DeleteProfileConfirm from "@/components/Profiles/DeleteProfileConfirm.vue";
import useApp from "@/store/App/App";
import useProfile from "@/store/Profile/Profile";
import type { Profile } from "@/core/lib/profiles";

const router = useRouter();
const appStore = useApp();
const profileStore = useProfile();

const otherProfiles = computed(() =>
    profileStore.profiles.filter(
        (profile) => profile.id !== profileStore.activeProfileId,
    ),
);

const switching = ref<string | null>(null);
const error = ref("");

const choose = async (id: string) => {
    error.value = "";
    switching.value = id;

    try {
        const ok = await profileStore.switchTo(id);

        if (ok) {
            await router.push({ name: "home" });
        } else {
            error.value = "Authentication was cancelled.";
        }
    } catch {
        error.value = "Something went wrong while switching profiles.";
    } finally {
        switching.value = null;
    }
};

const formOpen = ref(false);
const formMode = ref<"create" | "rename">("create");
const formProfile = ref<Profile | null>(null);

const startCreate = () => {
    formMode.value = "create";
    formProfile.value = null;
    formOpen.value = true;
};

const startRename = (profile: Profile) => {
    formMode.value = "rename";
    formProfile.value = profile;
    formOpen.value = true;
};

const deleteOpen = ref(false);
const deleteTarget = ref<Profile | null>(null);

const startDelete = (profile: Profile) => {
    error.value = "";
    deleteTarget.value = profile;
    deleteOpen.value = true;
};

onMounted(async () => {
    appStore.setTitle("Profiles");
    await profileStore.refreshProfiles();
});
</script>
