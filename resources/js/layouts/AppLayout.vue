<template>
    <div class="mx-auto flex min-h-dvh w-full flex-col bg-ink">
        <TopBar @toggle-menu="sidebarOpen = !sidebarOpen" />
        <Loader :show="appStore.isLoading" />
        <Sidebar v-model="sidebarOpen" />

        <main class="flex-1 overflow-y-auto">
            <RouterView />
        </main>

        <NavigationBar />
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TopBar from "@/components/common/TopBar.vue";
import Sidebar from "@/components/common/Sidebar.vue";
import NavigationBar from "@/components/common/NavigationBar.vue";
import Loader from "@/components/common/Loader.vue";
import useApp from "@/store/App/App";

const sidebarOpen = ref(false);
const appStore = useApp();
</script>
