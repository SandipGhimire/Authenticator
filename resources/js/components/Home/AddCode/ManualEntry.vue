<template>
    <form class="space-y-5" @submit.prevent="addManually">
        <div
            v-if="error.status"
            class="rounded-xl border border-red-500/20 bg-red-500/5 p-4"
        >
            <div class="flex items-start gap-3">
                <Icons
                    name="CircleAlert"
                    :size="18"
                    class-value="mt-0.5 shrink-0 text-red-500"
                />

                <div class="min-w-0">
                    <p class="text-sm font-medium text-red-500">
                        Unable to add account
                    </p>

                    <p
                        class="mt-1 break-words text-xs leading-relaxed text-red-500/80"
                    >
                        {{ error.reason }}
                    </p>
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div>
                <label class="mb-1.5 block text-xs text-ash">
                    Account name
                </label>

                <input
                    v-model="form.name"
                    type="text"
                    placeholder="e.g. GitHub"
                />
            </div>

            <div>
                <label class="mb-1.5 block text-xs text-ash"> Account </label>

                <input
                    v-model="form.username"
                    type="text"
                    placeholder="e.g. you@example.com"
                />
            </div>

            <div>
                <label class="mb-1.5 block text-xs text-ash">
                    Secret key
                </label>

                <input
                    v-model="form.secret"
                    type="text"
                    placeholder="JBSWY3DPEHPK3PXP"
                    autocomplete="off"
                    class="font-mono uppercase"
                />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="mb-1.5 block text-xs text-ash">
                        Algorithm
                    </label>

                    <select v-model="form.algorithm">
                        <option
                            v-for="algorithm in SUPPORTED_ALGORITHMS"
                            :key="algorithm"
                            :value="algorithm"
                        >
                            {{ algorithm }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="mb-1.5 block text-xs text-ash">
                        Code digits
                    </label>

                    <select v-model="form.digits">
                        <option
                            v-for="digits in SUPPORTED_DIGITS"
                            :key="digits"
                            :value="digits"
                        >
                            {{ digits }} digits
                        </option>
                    </select>
                </div>
            </div>

            <div>
                <label class="mb-1.5 block text-xs text-ash">
                    Refresh interval (seconds)
                </label>

                <input
                    v-model.number="form.period"
                    type="number"
                    min="1"
                    placeholder="30"
                />
            </div>
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
import Icons from "@/components/common/Icons.vue";
import {
    Algorithm,
    buildManualAccount,
    Digits,
    OtpParseError,
    ParsedAccount,
    SUPPORTED_ALGORITHMS,
    SUPPORTED_DIGITS,
} from "@/core/lib/otp";
import { saveAccount } from "@/core/lib/vault";
import { reactive, ref } from "vue";

const emit = defineEmits<{
    saved: [];
}>();

const form = reactive({
    name: "",
    username: "",
    secret: "",
    algorithm: "SHA1" as Algorithm,
    digits: 6 as Digits,
    period: 30,
});

const error = reactive({
    status: false,
    reason: "",
});

const showError = (message: string) => {
    error.status = true;
    error.reason = message;

    setTimeout(() => {
        error.status = false;
        error.reason = "";
    }, 5000);
};

const clearError = () => {
    error.status = false;
    error.reason = "";
};

const resetForm = () => {
    form.name = "";
    form.username = "";
    form.secret = "";
    form.algorithm = "SHA1";
    form.digits = 6;
    form.period = 30;
};

const addManually = async () => {
    clearError();

    if (!form.name.trim() || !form.secret.trim()) {
        showError("Account name and secret key are required.");
        return;
    }

    try {
        const accountDetails: ParsedAccount = buildManualAccount({
            name: form.name,
            username: form.username,
            secret: form.secret,
            algorithm: form.algorithm,
            digits: form.digits,
            period: form.period,
        });

        await saveAccount(accountDetails);

        resetForm();
        emit("saved");
    } catch (e) {
        if (e instanceof OtpParseError) {
            showError(e.message);
        } else {
            showError("Unexpected Error: " + e);
        }
    }
};
</script>
