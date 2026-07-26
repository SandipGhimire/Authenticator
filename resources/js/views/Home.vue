<template>
    <div class="relative min-h-full px-6 py-8 pb-28">
        <section
            v-if="accounts.length === 0"
            class="flex min-h-[60vh] flex-col items-center justify-center text-center"
        >
            <div
                class="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-panel"
            >
                <Icons
                    name="Shield"
                    :size="28"
                    class-value="text-signal"
                />
            </div>

            <!-- Text -->
            <div class="mt-5 space-y-2">
                <p
                    class="font-mono text-[11px] uppercase tracking-[0.2em] text-ash"
                >
                    Your vault
                </p>

                <h2
                    class="font-display text-xl font-semibold text-paper"
                >
                    No codes stored yet
                </h2>

                <p
                    class="mx-auto max-w-[30ch] text-sm leading-relaxed text-ash"
                >
                    Add your first two-factor authentication account and keep
                    your verification codes ready whenever you need them.
                </p>
            </div>

            <!-- Demo button -->
            <button
                type="button"
                class="mt-6 inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2.5 text-xs font-medium text-paper transition-colors hover:border-signal hover:text-signal"
                @click="loadDemoAccounts"
            >
                <Icons name="FlaskConical" :size="15" />
                Load demo accounts
            </button>

            <p class="mt-8 font-mono text-xs text-ash">
                Everything stays on this device.
            </p>
        </section>

        <!-- Vault -->
        <section v-else>
            <!-- Search -->
            <div class="relative mb-5">
                <Icons
                    name="Search"
                    :size="17"
                    class-value="absolute top-1/2 left-3 -translate-y-1/2 text-ash"
                />

                <input
                    v-model="search"
                    type="search"
                    autocomplete="off"
                    placeholder="Search accounts..."
                    class="w-full rounded-xl border border-line bg-panel py-3 pr-4 pl-10 text-sm text-paper outline-none transition-colors placeholder:text-ash/60 focus:border-signal"
                />

                <!-- Clear -->
                <button
                    v-if="search"
                    type="button"
                    class="absolute top-1/2 right-3 -translate-y-1/2 text-ash transition-colors hover:text-paper"
                    aria-label="Clear search"
                    @click="search = ''"
                >
                    <Icons name="X" :size="16" />
                </button>
            </div>

            <!-- Account List -->
            <div class="space-y-3">
                <AuthenticatorItem
                    v-for="account in filteredAccounts"
                    :key="account.id"
                    :account="account"
                />
            </div>

            <!-- No Search Results -->
            <div
                v-if="filteredAccounts.length === 0"
                class="flex flex-col items-center py-16 text-center"
            >
                <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-panel"
                >
                    <Icons
                        name="SearchX"
                        :size="21"
                        class-value="text-ash"
                    />
                </div>

                <p class="mt-4 text-sm font-medium text-paper">
                    No accounts found
                </p>

                <p class="mt-1 max-w-[28ch] text-xs leading-relaxed text-ash">
                    Nothing matches "{{ search }}". Try searching for another
                    account or email.
                </p>

                <button
                    type="button"
                    class="mt-4 font-mono text-[11px] text-signal underline underline-offset-4"
                    @click="search = ''"
                >
                    Clear search
                </button>
            </div>
        </section>

        <!-- Add Account -->
        <AddCode @add="handleAdd" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import Icons from "@/components/common/Icons.vue";
import AuthenticatorItem from "@/components/Home/Item.vue";
import AddCode from "@/components/Home/AddCode.vue";
import useApp from "@/store/App/App";

const appStore = useApp();

interface Account {
    id: number;
    name: string;
    username: string;
    code: string;
}

const search = ref("");

const accounts = ref<Account[]>([]);

const filteredAccounts = computed(() => {
    const query = search.value.trim().toLowerCase();

    if (!query) {
        return accounts.value;
    }

    return accounts.value.filter((account) => {
        return (
            account.name.toLowerCase().includes(query) ||
            account.username.toLowerCase().includes(query)
        );
    });
});

const loadDemoAccounts = () => {
    accounts.value = [
        {
            id: 1,
            name: "GitHub",
            username: "sandip@example.com",
            code: "482 913",
        },
        {
            id: 2,
            name: "Google",
            username: "sandip@example.com",
            code: "731 204",
        },
        {
            id: 3,
            name: "Cloudflare",
            username: "sandip@example.com",
            code: "194 826",
        },
        {
            id: 4,
            name: "Discord",
            username: "sandip@example.com",
            code: "563 721",
        },
        {
            id: 5,
            name: "GitLab",
            username: "developer@example.com",
            code: "927 415",
        },
    ];
};

const handleAdd = (account: {
    name: string;
    username: string;
    secret: string;
}) => {
    accounts.value.push({
        id: Date.now(),
        name: account.name,
        username: account.username,
        code: "000 000",
    });
};

onMounted(() => {
    appStore.setTitle("Home");
})
</script>
