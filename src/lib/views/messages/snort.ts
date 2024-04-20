import { seedRelays } from "@/snort_workers/seed_relays";
import { NostrSystem, type QueryLike } from "@snort/system";
import { writable } from "svelte/store";

export const System = new NostrSystem({checkSigs: false});
let started = false;

export async function init() {
    if (!started) {
        started = true;
        await System.Init();
        for (let relay of seedRelays) {
            await System.ConnectToRelay(relay, { read: true, write: false });
        }
    }
}