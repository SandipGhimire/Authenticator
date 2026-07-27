<template>
    <Transition name="scrim">
        <div
            v-if="modelValue"
            class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            @click="close"
        />
    </Transition>

    <Transition name="drawer">
        <aside
            v-if="modelValue"
            class="fixed inset-y-0 left-0 z-50 flex w-[78%] max-w-xs flex-col border-r border-line bg-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
        >
            <div
                class="flex items-center gap-2 border-b border-line px-4"
                style="
                    padding-top: max(env(safe-area-inset-top), 1rem);
                    padding-bottom: 1rem;
                "
            >
                <span
                    class="flex-1 font-display text-[18px] font-semibold tracking-tight text-paper"
                    >Authenticator</span
                >
                <button
                    type="button"
                    aria-label="Close menu"
                    class="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-ash transition-colors hover:bg-panel-2 hover:text-paper"
                    @click="close"
                >
                    <Icons name="X" :size="18" />
                </button>
            </div>

            <nav class="flex-1 px-2 py-3">
                <RouterLink
                    v-for="item in navItems"
                    :key="item.name"
                    :to="item.path"
                    class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ash transition-colors hover:bg-panel-2 hover:text-paper"
                    active-class="bg-panel-2 text-signal-bright"
                    @click="close"
                >
                    <Icons :name="navIconMap[item.name]" :size="18" />
                    {{ item.label }}
                </RouterLink>

                <div class="mt-5 border-t-2 border-line pt-3">
                    <button
                        class="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 p-3 active:bg-red-600 active:scale-[0.98] transition-transform"
                        @click="appStore.logout"
                    >
                        <Icons name="LogOut" :size="18" />
                        Logout
                    </button>
                </div>
            </nav>

            <div
                class="border-t border-line px-4 py-3 font-mono text-xs text-ash text-center"
                style="
                    padding-bottom: max(env(safe-area-inset-bottom), 0.75rem);
                "
            >
                Made By Sandip Ghimire (v1.0.0)
            </div>
        </aside>
    </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import Icons from "@/components/common/Icons.vue";
import { navItems } from "@/router";
import useApp from "@/store/App/App";

const navIconMap: Record<string, string> = {
    home: "Home",
    "import-export": "DatabaseBackup",
    about: "Info",
};
const appStore = useApp();

const modelValue = defineModel<boolean>({ default: false });

function close() {
    modelValue.value = false;
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") close();
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style scoped>
.scrim-enter-active,
.scrim-leave-active {
    transition: opacity 0.2s ease;
}
.scrim-enter-from,
.scrim-leave-to {
    opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.drawer-enter-from,
.drawer-leave-to {
    transform: translateX(-100%);
}
</style>
