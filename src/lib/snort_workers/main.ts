import { writable, type Writable } from 'svelte/store';
import { Command, FrontendData } from './types';

import WorkerVite from "./master_worker?worker"
import type { NostrEvent } from 'nostr-tools';
import { execTime } from './utils';

export let FrontendDataStore = writable(new FrontendData())
export let viewed: Writable<Set<string>> = writable(new Set());

let worker: Worker;

export async function Init(pubkey?:string) {
    let end = execTime("14 init worker")
    worker = new WorkerVite()
    end()
		worker.onmessage = (x: MessageEvent<FrontendData>) => {
            let w_end = execTime("w_end")
            FrontendDataStore.update((current) => {
                current = x.data;
                w_end()
                return current;
            });
        };;
        let end2 = execTime("21 worker.postMessage")
        let cmd = new Command("start")
        cmd.pubkey = pubkey
		worker.postMessage(cmd);
        end2()
}

export function UpdatePubkey(pubkey:string) {
    if (worker) {
        worker.terminate()
    }
    FrontendDataStore.set(new FrontendData())
    Init(pubkey)
    // let end = execTime("31 set pubkey")
    // if (worker) {
    //     let cmd = new Command("set_master_pubkey")
    //     cmd.pubkey = pubkey
    //     worker.postMessage(cmd)
    // } else {
    //     console.log("no worker started")
    // }
    //end()
}

export function PushEvent(e: NostrEvent[]) {
    let end = execTime("34 pushevent")
    if (worker) {
        let cmd = new Command("push_event")
        cmd.event = e
        //worker.postMessage(new Command("ping"))
        worker.postMessage(cmd)
        //worker.postMessage(new Command("ping"))
    } else {
        console.log("no worker started")
    }
    end()
}