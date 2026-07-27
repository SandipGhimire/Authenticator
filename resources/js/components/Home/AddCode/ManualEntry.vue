<template>
    <form class="space-y-4" @submit.prevent="addManually">
        <div>
            <label class="mb-1.5 block text-xs text-ash"> Account name </label>

            <input
                v-model="form.name"
                type="text"
                placeholder="e.g. GitHub"
                class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-paper outline-none placeholder:text-ash/50 focus:border-signal"
            />
        </div>

        <div>
            <label class="mb-1.5 block text-xs text-ash"> Account </label>

            <input
                v-model="form.username"
                type="text"
                placeholder="e.g. you@example.com"
                class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-paper outline-none placeholder:text-ash/50 focus:border-signal"
            />
        </div>

        <div>
            <label class="mb-1.5 block text-xs text-ash"> Secret key </label>

            <input
                v-model="form.secret"
                type="text"
                placeholder="JBSWY3DPEHPK3PXP"
                autocomplete="off"
                class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-sm uppercase text-paper outline-none placeholder:text-ash/50 focus:border-signal"
            />
        </div>

        <button
            type="submit"
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90"
        >
            <Icons name="Plus" :size="17" />
            Add Account
        </button>
    </form>
</template>

<script lang="ts" setup>
import { reactive } from "vue";

const form = reactive({
    name: "",
    username: "",
    secret: "",
});

const resetForm = () => {
    form.name = "";
    form.username = "";
    form.secret = "";
};

const addManually = () => {
    if (!form.name.trim() || !form.secret.trim()) {
        return;
    }

    resetForm();
    close();
};
</script>
