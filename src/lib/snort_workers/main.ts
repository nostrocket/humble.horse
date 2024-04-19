import { writable, type Writable } from 'svelte/store';
import { Command, FrontendData } from './types';

import WorkerVite from "./master_worker?worker"
import type { NostrEvent } from 'nostr-tools';

export let FrontendDataStore = writable(new FrontendData())
export let viewed: Writable<Set<string>> = writable(new Set());

let worker: Worker;

export async function Init() {
    worker = new WorkerVite()
		worker.onmessage = (x: MessageEvent<FrontendData>) => {
            FrontendDataStore.update((current) => {
                current = x.data;
                return current;
            });
        };;
		worker.postMessage(new Command("start")); //todo add pubkey
}

export function UpdatePubkey(pubkey:string) {

}

export function PushEvent(e: NostrEvent) {
    if (worker) {
        let cmd = new Command("push_event")
        cmd.event = e
        worker.postMessage(cmd)
    }
}