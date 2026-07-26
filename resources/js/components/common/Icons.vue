<template>
    <component
        v-if="icon"
        :is="icon"
        :size="parseInt(size.toString())"
        :color="color"
        :stroke-width="strokeWidth"
        :absolute-stroke-width="absoluteStrokeWidth"
        :class="classValue"
    />
</template>

<script setup lang="ts">
import { computed } from "vue";
import * as icons from "@lucide/vue";
import type { LucideIcon } from "@lucide/vue";

type IconName = keyof typeof icons;

interface IconProps {
    name: string;
    size?: number | string;
    color?: string;
    strokeWidth?: number;
    absoluteStrokeWidth?: boolean;
    classValue?: string;
}

const props = withDefaults(defineProps<IconProps>(), {
    size: 16,
    color: "currentColor",
    strokeWidth: 2,
    absoluteStrokeWidth: false,
    classValue: "",
});

const icon = computed<LucideIcon | null>(() => {
    const iconComponent = icons[props.name as IconName] as
        LucideIcon | undefined;
    return iconComponent || null;
});
</script>
