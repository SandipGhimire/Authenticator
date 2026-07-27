import { ref } from "vue";

export const clockTick = ref(Date.now());

function tick(): void {
    clockTick.value = Date.now();
    setTimeout(tick, 1000 - (Date.now() % 1000));
}

setTimeout(tick, 1000 - (Date.now() % 1000));
