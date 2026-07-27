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

        <div class="space-y-4">
            <ExportPanel :account-count="accountCount" @exported="refresh" />
            <ImportPanel @imported="refresh" />
        </div>

        <p class="mt-6 text-center font-mono text-[10px] text-ash">
            Backups are encrypted with AES-256-GCM. Only your password can
            unlock them — not even this app can recover a lost one.
        </p>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Icons from "@/components/common/Icons.vue";
import ExportPanel from "@/components/ImportExport/ExportPanel.vue";
import ImportPanel from "@/components/ImportExport/ImportPanel.vue";
import useApp from "@/store/App/App";
import { listAccounts } from "@/core/lib/vault";

const appStore = useApp();

const accountCount = ref(0);

const refresh = async () => {
    accountCount.value = (await listAccounts()).length;
};

onMounted(async () => {
    appStore.setTitle("Import & Export");
    await refresh();
});
</script>
