<template>
    <div class="rounded-xl border border-line bg-panel p-4">
        <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
                <div class="flex items-center gap-2">
                    <div
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface"
                    >
                        <span
                            class="font-display text-sm font-semibold text-signal"
                        >
                            {{ account.name.charAt(0) }}
                        </span>
                    </div>

                    <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-paper">
                            {{ account.name }}
                        </p>

                        <p class="truncate text-xs text-ash">
                            {{ account.username }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="flex shrink-0 items-center gap-1.5">
                <div
                    class="h-1.5 w-1.5 rounded-full"
                    :class="remaining <= 5 ? 'bg-red-400' : 'bg-signal'"
                />

                <span
                    class="font-mono text-[11px]"
                    :class="remaining <= 5 ? 'text-red-400' : 'text-ash'"
                >
                    {{ remaining }}s
                </span>
            </div>
        </div>

        <div class="mt-5 flex items-end justify-between">
            <p
                class="font-mono text-3xl font-semibold tracking-[0.15em] text-paper"
            >
                {{ account.code }}
            </p>

            <button
                type="button"
                class="rounded-lg p-2 text-ash transition-colors hover:bg-surface hover:text-paper"
                aria-label="Copy authentication code"
                @click="copyCode"
            >
                <Icons name="Copy" :size="17" />
            </button>
        </div>

        <div class="mt-4 h-1 overflow-hidden rounded-full bg-surface">
            <div
                class="h-full rounded-full transition-all duration-1000"
                :class="remaining <= 5 ? 'bg-red-400' : 'bg-signal'"
                :style="{ width: `${progress}%` }"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Icons from "@/components/common/Icons.vue";

interface Account {
    name: string;
    username: string;
    code: string;
}

const props = defineProps<{
    account: Account;
}>();

const remaining = ref(30);

let timer: ReturnType<typeof setInterval> | null = null;

const progress = computed(() => {
    return (remaining.value / 30) * 100;
});

const updateTimer = () => {
    const seconds = new Date().getSeconds();
    remaining.value = 30 - (seconds % 30);
};

const copyCode = async () => {
    await navigator.clipboard.writeText(props.account.code);
};

onMounted(() => {
    updateTimer();

    timer = setInterval(updateTimer, 1000);
});

onBeforeUnmount(() => {
    if (timer) {
        clearInterval(timer);
    }
});
</script>
