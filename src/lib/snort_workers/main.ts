import { writable } from 'svelte/store';
import { Command, FrontendData } from './types';

import WorkerVite from "./master_worker?worker"

export let FrontendDataStore = writable(new FrontendData())

export async function Init() {
    const worker = new WorkerVite()
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