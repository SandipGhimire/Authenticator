import useApp from "@/store/App/App";
import {
    createRouter,
    createWebHistory,
    type RouteRecordRaw,
} from "vue-router";

export interface NavItem {
    name: string;
    path: string;
    label: string;
}

export const navItems: NavItem[] = [
    { name: "home", path: "/user/home", label: "Home" },
    { name: "about", path: "/user/about", label: "About" },
];

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        name: "main",
        component: () => import("@/views/Main.vue"),
        meta: { onlyGuest: true },
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
            },
            {
                path: "about",
                name: "about",
                component: () => import("@/views/About.vue"),
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
    return true;
});

export default router;
