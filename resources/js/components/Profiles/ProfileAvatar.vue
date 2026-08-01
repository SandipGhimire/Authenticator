<template>
    <div
        class="flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-ink"
        :style="{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            fontSize: `${Math.round(size * 0.4)}px`,
        }"
        aria-hidden="true"
    >
        {{ initials }}
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface ProfileAvatarProps {
    name: string;
    color: string;
    size?: number;
}

const props = withDefaults(defineProps<ProfileAvatarProps>(), {
    size: 40,
});

const initials = computed(() => {
    const parts = props.name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "?";
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});
</script>
