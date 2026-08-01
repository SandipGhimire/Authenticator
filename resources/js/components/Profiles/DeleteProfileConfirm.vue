<template>
    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="open"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
                @click.self="close"
            >
                <div
                    class="w-full max-w-sm rounded-2xl border border-line bg-panel p-5 shadow-2xl"
                >
                    <div
                        class="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10"
                    >
                        <Icons
                            name="Trash2"
                            :size="20"
                            class-value="text-red-500"
                        />
                    </div>

                    <p
                        class="mt-4 font-display text-base font-semibold text-paper"
                    >
                        Delete "{{ profile?.name }}"?
                    </p>

                    <p class="mt-1.5 text-sm leading-relaxed text-ash">
                        This permanently deletes every code stored in this
                        profile. This action cannot be undone, and if you have
                        no other way to generate these codes, you may lose
                        access to those accounts.
                    </p>

                    <div
                        v-if="error"
                        class="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs leading-relaxed text-red-500/90"
                    >
                        {{ error }}
                    </div>

                    <div class="mt-5 flex gap-3">
                        <button
                            type="button"
                            class="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-paper transition-colors hover:bg-surface disabled:opacity-60"
                            :disabled="busy"
                            @click="close"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-paper transition-colors active:bg-red-500 disabled:opacity-60"
                            :disabled="busy"
                            @click="confirm"
                        >
                            <Spinner v-if="busy" :size="16" />
                            <span v-else>Delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Icons from "@/components/common/Icons.vue";
import Spinner from "@/components/common/Spinner.vue";
import useProfile from "@/store/Profile/Profile";
import { ProfileError, type Profile } from "@/core/lib/profiles";

const props = defineProps<{
    profile: Profile | null;
}>();

const open = defineModel<boolean>({ default: false });

const emit = defineEmits<{
    deleted: [];
}>();

const profileStore = useProfile();

const busy = ref(false);
const error = ref("");

watch(open, (isOpen) => {
    if (isOpen) {
        error.value = "";
    }
});

const close = () => {
    if (busy.value) return;
    open.value = false;
};

const confirm = async () => {
    if (!props.profile) return;

    error.value = "";
    busy.value = true;

    try {
        const ok = await profileStore.deleteProfile(props.profile.id);

        if (ok) {
            open.value = false;
            emit("deleted");
        } else {
            error.value = "Authentication was cancelled.";
        }
    } catch (e) {
        error.value =
            e instanceof ProfileError
                ? e.message
                : "Something went wrong while deleting this profile.";
    } finally {
        busy.value = false;
    }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
