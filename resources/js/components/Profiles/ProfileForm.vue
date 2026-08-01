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
                        class="flex h-11 w-11 items-center justify-center rounded-full bg-signal/10"
                    >
                        <Icons
                            :name="mode === 'rename' ? 'PenLine' : 'UserPlus'"
                            :size="20"
                            class-value="text-signal"
                        />
                    </div>

                    <p
                        class="mt-4 font-display text-base font-semibold text-paper"
                    >
                        {{
                            mode === "rename"
                                ? "Rename profile"
                                : "Add a profile"
                        }}
                    </p>

                    <p class="mt-1.5 text-sm leading-relaxed text-ash">
                        {{
                            mode === "rename"
                                ? "Give this profile a new name."
                                : "Each profile keeps its own separate set of codes."
                        }}
                    </p>

                    <form class="mt-4 space-y-3" @submit.prevent="submit">
                        <div
                            v-if="error"
                            class="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs leading-relaxed text-red-500/90"
                        >
                            {{ error }}
                        </div>

                        <div>
                            <label class="mb-1.5 block text-xs text-ash">
                                Name
                            </label>

                            <input
                                v-model="name"
                                type="text"
                                autocomplete="off"
                                placeholder="e.g. Work"
                                maxlength="40"
                            />
                        </div>

                        <div v-if="mode === 'create'">
                            <label class="mb-1.5 block text-xs text-ash">
                                Color
                            </label>

                            <div class="flex flex-wrap gap-2">
                                <button
                                    v-for="swatch in PROFILE_COLORS"
                                    :key="swatch"
                                    type="button"
                                    class="h-8 w-8 rounded-full border-2 transition-transform active:scale-95"
                                    :class="
                                        color === swatch
                                            ? 'border-paper'
                                            : 'border-transparent'
                                    "
                                    :style="{ backgroundColor: swatch }"
                                    :aria-label="`Use this color`"
                                    :aria-pressed="color === swatch"
                                    @click="color = swatch"
                                />
                            </div>
                        </div>

                        <div class="flex gap-3 pt-2">
                            <button
                                type="button"
                                class="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-paper transition-colors hover:bg-surface disabled:opacity-60"
                                :disabled="busy"
                                @click="close"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="flex-1 rounded-lg bg-signal py-2.5 text-sm font-medium text-paper transition-colors active:opacity-90 disabled:opacity-60"
                                :disabled="busy"
                            >
                                {{
                                    busy
                                        ? "Saving..."
                                        : mode === "rename"
                                          ? "Save"
                                          : "Add"
                                }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Icons from "@/components/common/Icons.vue";
import useProfile from "@/store/Profile/Profile";
import {
    PROFILE_COLORS,
    ProfileError,
    pickProfileColor,
    type Profile,
} from "@/core/lib/profiles";

const props = defineProps<{
    mode: "create" | "rename";
    profile?: Profile | null;
}>();

const open = defineModel<boolean>({ default: false });

const emit = defineEmits<{
    saved: [];
}>();

const profileStore = useProfile();

const name = ref("");
const color = ref<string>(PROFILE_COLORS[0]);
const busy = ref(false);
const error = ref("");

watch(open, (isOpen) => {
    if (!isOpen) return;

    error.value = "";

    if (props.mode === "rename" && props.profile) {
        name.value = props.profile.name;
        color.value = props.profile.color;
    } else {
        name.value = "";
        color.value = pickProfileColor(profileStore.profiles.length);
    }
});

const close = () => {
    if (busy.value) return;
    open.value = false;
};

const submit = async () => {
    error.value = "";
    busy.value = true;

    try {
        if (props.mode === "rename" && props.profile) {
            await profileStore.renameProfile(props.profile.id, name.value);
        } else {
            await profileStore.createProfile(name.value, color.value);
        }

        open.value = false;
        emit("saved");
    } catch (e) {
        error.value =
            e instanceof ProfileError
                ? e.message
                : "Something went wrong. Please try again.";
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
