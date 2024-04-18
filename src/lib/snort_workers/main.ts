import { writable } from 'svelte/store';
import { Command, FrontendData } from './types';

import WorkerVite from "./master_worker?worker"

let worker:Worker;

export let FrontendDataStore = writable(new FrontendData())

// const workerScript = import.meta.env.DEV
//   ? new URL("./", import.meta.url)
//   : new WorkerVite();

export async function Init() {
    //const w = await import('./master_worker.ts?worker');
    const worker = new WorkerVite()
		//worker = new w.default();
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