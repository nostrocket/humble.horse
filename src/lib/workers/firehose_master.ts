import { get, writable, type Writable } from 'svelte/store';
import { Command, ResponseData } from './firehose.types';
import { currentPubkey } from '@/stores/user';

export let responseFromWorker: Writable<ResponseData> = writable(new ResponseData());
let initted = false
export function Init() {
    if (!initted) {
        setupWorker();
    }

}

let firehoseWorker: Worker | undefined = undefined;

const onWorkerMessage = (x: MessageEvent<ResponseData>) => {
	// if (!responseFromWorker) {
	// 	responseFromWorker = writable(x.data);
	// }
	responseFromWorker.update((current) => {
		current = x.data;
		return current;
	});
};
let WorkerStarted = false;

let setupWorker = async () => {
	if (!WorkerStarted) {
		WorkerStarted = true;
		const w = await import('./firehose.ts?worker');
		firehoseWorker = new w.default();
		firehoseWorker.onmessage = onWorkerMessage;
		firehoseWorker.postMessage(connect);
        console.log(30)
	}
};

let start: Command = {
	command: 'start',
	pubkey: 'd91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075'
};

currentPubkey.subscribe(pubkey=>{
    if (pubkey && firehoseWorker) {
        firehoseWorker.postMessage({
            command: 'start',
            pubkey: pubkey
        })
    }
})

let connect: Command = {
	command: 'connect',
    pubkey: get(currentPubkey) || 'd91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075'
};

let rootPubkey = 'd91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075';
