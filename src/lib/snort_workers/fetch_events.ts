import { NostrSystem, RequestBuilder } from '@snort/system';
import type { NostrEvent } from 'nostr-tools';
import { writable } from 'svelte/store';
import type { Command } from './types';
import { seedRelays } from '@/snort_workers/seed_relays';

let events = new Map<string, NostrEvent>();
let eventStore = writable(events);
let eventIDSet = new Set<string>()

onmessage = (m: MessageEvent<Command>) => {
	if (m.data.command == 'fetch_events') {
		if (m.data.events && m.data.events.length > 0) start(m.data.events);
		eventStore.subscribe((evs) => {
            postMessage(evs)
            //postMessage(evs.size)
			// for (let [id, e] of evs) {
			// 	postMessage(e);
			// }
		});
	}
};
let total = 0
let count = 0
async function start(eventIDs: string[]) {
	return new Promise((resolve, reject) => {
		const sys = new NostrSystem({
			checkSigs: true //todo: check sigs JIT on rendering
			// automaticOutboxModel: true,
			// buildFollowGraph: true,
		});
		(async () => {
			await sys.Init();
			seedRelays.forEach((r) => sys.ConnectToRelay(r, { read: true, write: false }));

			const rb = new RequestBuilder('permasub');

			rb.withFilter().ids(eventIDs);
			rb.withOptions({ leaveOpen: false });
			const q = sys.Query(rb);

			q.on('event', (evs): void => {
                total += evs.length
                count ++
                //console.log(count, evs.length, total)
                //console.log(42, evs.length)
				//let dirty = false;
                evs.forEach(e=>{
                    events.set(e.id, e)
                })
                // evs.forEach(e=>{
                //     if (!events.has(e.id)) {
				// 		dirty = true;
				// 		let eNt = getNostrEvent(e);
				// 		events.set(e.id, eNt);
				// 	}
                // })
				// for (let e of evs) {
				// 	if (!events.has(e.id)) {
				// 		dirty = true;
				// 		let eNt = getNostrEvent(e);
				// 		events.set(e.id, eNt);
				// 	}
				// }
				// if (true) {
					eventStore.update((d) => {
						return d;
					});
				// }
			});
		})();
	});
}
