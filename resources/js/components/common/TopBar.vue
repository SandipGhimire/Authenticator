<template>
    <header
        class="scan-line sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-panel/95 px-4 backdrop-blur"
        style="padding-top: max(env(safe-area-inset-top), 0.75rem); padding-bottom: 0.75rem"
    >
        <button
            type="button"
            aria-label="Open menu"
            class="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ash transition-colors hover:bg-panel-2 hover:text-paper active:bg-panel-2"
            @click="$emit('toggle-menu')"
        >
            <Icons name="Menu" :size="20" />
        </button>

        <div class="flex flex-1 items-center gap-2">
            <span class="font-display text-[18px] font-semibold tracking-tight text-paper">{{ pageTitle }}</span>
        </div>
    </header>
</template>

<script setup lang="ts">
import Icons from "@/components/common/Icons.vue";
import useApp from "@/store/App/App";
import { storeToRefs } from "pinia";

const app = useApp();
const {pageTitle} = storeToRefs(app);

defineEmits<{ (e: "toggle-menu"): void }>();
</script>
