import { defineStore } from "pinia";
import { Biometrics } from "@vendor/sghimire/mobile-biometric/resources/js/biometric.js";
import router from "@/router";

const useApp = defineStore("app", {
    state: () => ({
        isAuthenticated: false,
        pageTitle: "",
        isLoading: false,
    }),

    getters: {},
    actions: {
        async authenticate() {
            await Biometrics.prompt()
                .id("checkout-auth")
                .title("Unlock Authenticator")
                .subtitle("Confirm it's you to continue")
                .cancelText("Cancel")
                .allowDeviceCredential();
        },

        async successLogin() {
            this.isAuthenticated = true;
            await router.replace({ name: "home" });
        },

        async logout() {
            this.isAuthenticated = false;
            await router.replace({ name: "main" });
        },

        setTitle(title: string) {
            this.pageTitle = title;
        },

        setLoading(loading: boolean) {
            this.isLoading = loading;
        },
    },
});

export default useApp;
