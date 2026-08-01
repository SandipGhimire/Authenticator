<template>
    <div class="min-h-full px-6 py-8 pb-28">
        <div class="flex flex-col items-center gap-3 pb-6 text-center">
            <div
                class="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-panel"
            >
                <Icons
                    name="DatabaseBackup"
                    :size="26"
                    class-value="text-signal"
                />
            </div>

            <div>
                <h1 class="font-display text-lg font-semibold text-paper">
                    Import & Export
                </h1>

                <p
                    class="mx-auto mt-1 max-w-[46ch] text-xs leading-relaxed text-ash"
                >
                    Move your vault between devices with a password-encrypted
                    backup file.
                </p>
            </div>
        </div>

        <div
            class="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-line bg-panel p-1"
        >
            <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                class="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-colors"
                :class="
                    activeTab === tab.id
                        ? 'bg-surface text-paper'
                        : 'text-ash hover:text-paper'
                "
                @click="activeTab = tab.id"
            >
                <Icons :name="tab.icon" :size="15" />
                {{ tab.label }}
            </button>
        </div>

        <div v-show="activeTab === 'internal'" class="space-y-4">
            <ImportPanel @imported="refresh" />
            <ExportPanel :account-count="accountCount" @exported="refresh" />

            <p class="mt-6 text-center font-mono text-[10px] text-ash">
                Backups are encrypted with AES-256-GCM. Only your password can
                unlock them — not even this app can recover a lost one.
            </p>
        </div>

        <div v-show="activeTab === 'google'" class="space-y-4">
            <GoogleImportPanel @imported="refresh" />
            <GoogleExportPanel :account-count="accountCount" />

            <p class="mt-6 text-center font-mono text-[10px] text-ash">
                Please note that Google Authenticator does not support multiple
                profiles. To organize your accounts, we recommend using labels.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Icons from "@/components/common/Icons.vue";
import ExportPanel from "@/components/ImportExport/ExportPanel.vue";
import ImportPanel from "@/components/ImportExport/ImportPanel.vue";
import GoogleImportPanel from "@/components/ImportExport/GoogleImportPanel.vue";
import GoogleExportPanel from "@/components/ImportExport/GoogleExportPanel.vue";
import useApp from "@/store/App/App";
import { listAccounts } from "@/core/lib/vault";

const appStore = useApp();

const accountCount = ref(0);

type TabId = "internal" | "google";

const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "internal", label: "Internal", icon: "DatabaseBackup" },
    { id: "google", label: "Google Authenticator", icon: "ScanLine" },
];

const activeTab = ref<TabId>("internal");

const refresh = async () => {
    accountCount.value = (await listAccounts()).length;
};

onMounted(async () => {
    appStore.setTitle("Import & Export");
    await refresh();
});
</script>
