<template>
    <nav
        class="sticky bottom-0 z-30 flex border-t border-line bg-panel/95 backdrop-blur"
        style="padding-bottom: max(env(safe-area-inset-bottom), 0.5rem)"
    >
        <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="item.path"
            class="tab relative flex flex-1 flex-col items-center gap-1 pt-2.5 pb-1.5 text-[11px] font-medium text-ash transition-colors"
            active-class="tab-active text-signal-bright"
        >
            <span class="tab-indicator" />
            <Icons :name="navIconMap[item.name]" :size="20" />
            {{ item.label }}
        </RouterLink>
    </nav>
</template>

<script setup lang="ts">
import Icons from "@/components/common/Icons.vue";
import { navItems } from "@/router";

const navIconMap: Record<string, string> = { home: "Home", about: "Info" };
</script>

<style scoped>
.tab-indicator {
    position: absolute;
    top: 0;
    left: 50%;
    height: 2px;
    width: 28px;
    border-radius: 2px;
    background: linear-gradient(
        90deg,
        var(--color-signal),
        var(--color-signal-bright)
    );
    transform: translateX(-50%) scaleX(0);
    transform-origin: center;
    transition: transform 0.25s ease;
}

.tab-active .tab-indicator {
    transform: translateX(-50%) scaleX(1);
}
</style>
