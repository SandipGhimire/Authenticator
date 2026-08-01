import useApp from "@/store/App/App";
import useProfile from "@/store/Profile/Profile";
import {
    createRouter,
    createWebHistory,
    type RouteRecordRaw,
} from "vue-router";

export interface NavItem {
    name: string;
    path: string;
    label: string;
    showInNav?: boolean;
}

export const navItems: NavItem[] = [
    { name: "home", path: "/user/home", label: "Home", showInNav: true },
    {
        name: "import-export",
        path: "/user/import-export",
        label: "Backup",
    },
    { name: "profiles", path: "/user/profiles", label: "Profiles" },
    { name: "settings", path: "/user/settings", label: "Settings" },
    { name: "about", path: "/user/about", label: "About", showInNav: true },
];

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        name: "main",
        component: () => import("@/views/Main.vue"),
        meta: { onlyGuest: true },
    },
    {
        path: "/bootstrapping",
        name: "bootstrapping",
        component: () => import("@/views/Bootstrapping.vue"),
        meta: { requireAuth: true },
    },
    {
        path: "/choose-profile",
        name: "choose-profile",
        component: () => import("@/views/ChooseProfile.vue"),
        meta: { requireAuth: true },
    },
    {
        path: "/user",
        component: () => import("@/layouts/AppLayout.vue"),
        meta: { requireAuth: true },
        children: [
            {
                path: "home",
                name: "home",
                component: () => import("@/views/Home.vue"),
                meta: { requireProfile: true },
            },
            {
                path: "import-export",
                name: "import-export",
                component: () => import("@/views/ImportExport.vue"),
                meta: { requireProfile: true },
            },
            {
                path: "profiles",
                name: "profiles",
                component: () => import("@/views/Profiles.vue"),
                meta: { requireProfile: true },
            },
            {
                path: "settings",
                name: "settings",
                component: () => import("@/views/Settings.vue"),
                meta: { requireProfile: true },
            },
            {
                path: "about",
                name: "about",
                component: () => import("@/views/About.vue"),
                meta: { requireProfile: true },
            },
        ],
    },
    {
        path: "/:pathMatch(.*)*",
        name: "not-found",
        component: () => import("@/views/404.vue"),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to) => {
    const appStore = useApp();

    if (to.meta.requireAuth && !appStore.isAuthenticated) {
        return { name: "main" };
    }

    if (to.meta.onlyGuest && appStore.isAuthenticated) {
        return { name: "home" };
    }

    if (to.meta.requireProfile) {
        const profileStore = useProfile();

        if (!profileStore.activeProfileId) {
            return profileStore.phase === "ready"
                ? { name: "choose-profile" }
                : { name: "bootstrapping" };
        }
    }

    return true;
});

export default router;
