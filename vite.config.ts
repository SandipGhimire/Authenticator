import { defineConfig } from "vite";
import { resolve } from "path";
import laravel from "laravel-vite-plugin";
import vue from "@vitejs/plugin-vue";
import {
    nativephpMobile,
    nativephpHotFile,
} from "./vendor/nativephp/mobile/resources/js/vite-plugin.js";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(__dirname, "./resources/js"),
            "@vendor": resolve(__dirname, "./vendor"),
        },
    },
    plugins: [
        nativephpMobile(),
        tailwindcss(),
        laravel({
            input: ["resources/js/app.ts"],
            hotFile: nativephpHotFile(),
            refresh: true,
        }),
        vue(),
    ],
    server: {
        port: 5174,
        strictPort: true,
        watch: {
            ignored: [
                "**/storage/framework/views/**",
                "**/nativephp/android/**",
                "**/nativephp/ios/**",
            ],
        },
    },
});
