<template>
    <div class="relative min-h-full px-6 py-6 pb-28">
        <section
            v-if="accounts.length === 0"
            class="flex min-h-[60vh] flex-col items-center justify-center text-center"
        >
            <div
                class="flex h-20 w-20 items-center justify-center rounded-2xl border border-line bg-panel overflow-hidden"
            >
                <img :src="iconUrl" alt="Authenticator" />
            </div>

            <div class="mt-5 space-y-2">
                <p
                    class="font-mono text-[12px] uppercase tracking-[0.2em] text-ash"
                >
                    Your vault
                </p>

                <h2 class="font-display text-2xl font-semibold text-paper">
                    No codes stored yet
                </h2>

                <p
                    class="mx-auto max-w-[50ch] text-sm leading-relaxed text-ash"
                >
                    Add your first two-factor authentication account and keep
                    your verification codes ready whenever you need them.
                </p>
            </div>

            <p class="mt-8 font-mono text-xs text-ash">
                Everything stays on this device.
            </p>
        </section>

        <section v-else>
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
                    class="rounded-xl bg-panel py-3 pr-4 pl-10"
                />

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

            <div class="space-y-3">
                <AuthenticatorItem
                    v-for="account in filteredAccounts"
                    :key="account.id"
                    :account="account"
                    @deleted="refreshAccounts"
                />
            </div>

            <div
                v-if="filteredAccounts.length === 0"
                class="flex flex-col items-center py-16 text-center"
            >
                <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-panel"
                >
                    <Icons name="SearchX" :size="21" class-value="text-ash" />
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

        <AddCode @saved="refreshAccounts" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import Icons from "@/components/common/Icons.vue";
import AuthenticatorItem from "@/components/Home/Item.vue";
import AddCode from "@/components/Home/AddCode.vue";
import useApp from "@/store/App/App";
import iconUrl from "@/assets/icon.png";
import { listAccounts, StoredAccount } from "@/core/lib/vault";

const appStore = useApp();

const search = ref("");

const accounts = ref<StoredAccount[]>([]);

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

const refreshAccounts = async () => {
    appStore.setLoading(true);

    try {
        accounts.value = await listAccounts();
    } finally {
        appStore.setLoading(false);
    }
};

onMounted(async () => {
    appStore.setTitle("Home");
    await refreshAccounts();
});
</script>
