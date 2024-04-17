import { writable } from 'svelte/store';
import { Command, FrontendData } from './types';

let worker:Worker;

export let FrontendDataStore = writable(new FrontendData())


export async function Init() {
    const w = await import('./master_worker.ts?worker');
		worker = new w.default();
		worker.onmessage = (x: MessageEvent<FrontendData>) => {
            FrontendDataStore.update((current) => {
                current = x.data;
                return current;
            });
        };;
		worker.postMessage(new Command("start", ""));
}

export function UpdatePubkey(pubkey:string) {

}