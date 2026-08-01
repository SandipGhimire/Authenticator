<template>
    <div>
        <div class="mb-2 flex items-center justify-between">
            <p class="text-xs text-ash">
                {{ modelValue.length }} of {{ accounts.length }} selected
            </p>

            <button
                type="button"
                class="font-mono text-[11px] text-signal underline underline-offset-4"
                @click="toggleAll"
            >
                {{ allSelected ? "Select none" : "Select all" }}
            </button>
        </div>

        <div
            class="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-line bg-surface p-2"
        >
            <label
                v-for="account in accounts"
                :key="account.id"
                class="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-panel-2"
            >
                <input
                    type="checkbox"
                    class="h-4 w-4 shrink-0 rounded border-line bg-panel p-0 accent-signal"
                    :checked="isSelected(account.id)"
                    @change="toggle(account.id)"
                />

                <span class="min-w-0 flex-1 truncate text-sm text-paper">
                    <span class="font-medium">{{ account.name }}</span>
                    <span v-if="account.username" class="text-ash">
                        · {{ account.username }}</span
                    >
                </span>
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { StoredAccount } from "@/core/lib/vault";

const props = defineProps<{
    accounts: StoredAccount[];
}>();

const modelValue = defineModel<string[]>({ default: () => [] });

const isSelected = (id: string) => modelValue.value.includes(id);

const toggle = (id: string) => {
    modelValue.value = isSelected(id)
        ? modelValue.value.filter((existing) => existing !== id)
        : [...modelValue.value, id];
};

const allSelected = computed(
    () =>
        props.accounts.length > 0 &&
        modelValue.value.length === props.accounts.length,
);

const toggleAll = () => {
    modelValue.value = allSelected.value
        ? []
        : props.accounts.map((account) => account.id);
};
</script>
