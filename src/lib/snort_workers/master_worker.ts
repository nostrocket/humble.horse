import { seedRelays } from '@/workers/seed_relays';
import { NostrSystem, RequestBuilder } from '@snort/system';
import { derived, writable } from 'svelte/store';
import { Command, FrontendData, WorkerData } from './types';
import { followsFromKind3, getNostrEvent } from './utils';

let workerData = new WorkerData();
let workerDataStore = writable(workerData);

workerDataStore.subscribe((data) => {
	let fed = new FrontendData();
	fed.basePubkey = data.ourPubkey();
	fed.baseFollows = data._ourFollows;
	postMessage(fed);
});

let follows = derived(workerDataStore, ($wds) => {
	return $wds._ourFollows;
});

let lengthOfFollows = derived(workerDataStore, ($wds) => {
	return $wds._ourFollows.size;
});

follows.subscribe(() => {
	console.log(27);
});

lengthOfFollows.subscribe((x) => {
	console.log(31);
	if (x > 0) {
		PermaSub([...workerData._ourFollows]);
	}
});

//contract:
onmessage = (m: MessageEvent<Command>) => {
	if (m.data.command == 'start') {
		start(m.data.pubkey)
			.then(() => {})
			.catch((err) => {
				console.log(err);
			});
	}
};

//connect to seed relays, get our follows and relays.
async function start(pubkey?: string, pubkeys?: string[]) {
	return new Promise((resolve, reject) => {
		if (pubkey) {
			workerData.setOurPubkey(pubkey);
		} else {
			pubkey = workerData.ourPubkey();
		}
		const sys = new NostrSystem({
			checkSigs: true
			// automaticOutboxModel: true,
			// buildFollowGraph: true,
		});
		(async () => {
			await sys.Init();
			seedRelays.forEach((r) => sys.ConnectToRelay(r, { read: true, write: false }));

			const rb = new RequestBuilder('fetch-initial-data');
			let _pukeys: string[] = [];
			if (pubkeys) {
				_pukeys = pubkeys;
			}
			if (pubkey) {
				_pukeys.push(pubkey);
			}
			rb.withFilter().authors(_pukeys).kinds([3, 10002]);
			rb.withOptions({ leaveOpen: false });

			const q = sys.Query(rb);
			q.on('event', (evs): void => {
				let updated = new Set<string>();
				for (let e of evs) {
					//todo: get all relays from all follows (3, 10002)
					let eNt = getNostrEvent(e);
					let latestForPubkey = workerData.latestReplaceable.get(e.pubkey);
					if (!latestForPubkey) {
						latestForPubkey = new Map();
					}
					let latestForDedupKey = latestForPubkey.get(e.kind.toString(10));

					if (!latestForDedupKey) {
						updated.add(eNt.pubkey);
						latestForDedupKey = eNt;
					}
					if (latestForDedupKey.created_at < eNt.created_at) {
						updated.add(eNt.pubkey);
						latestForDedupKey = eNt;
					}
					latestForPubkey.set(latestForDedupKey.kind.toString(10), latestForDedupKey);
					workerData.latestReplaceable.set(e.pubkey, latestForPubkey);
				}
				let dirty = false;
				for (let pubkey of updated) {
					if (pubkey == workerData.ourPubkey()) {
						let event = workerData.latestReplaceable.get(pubkey)?.get('3');
						if (event) {
							let follows = followsFromKind3(event);
							if (follows.size > 0) {
								workerData.setOurFollows(follows);
								dirty = true;
							}
						}
					}
				}
				if (dirty) {
					workerDataStore.update((d) => {
						return d;
					});
				}
				//todo: get all relays from all follows (3, 10002)
			});
		})();
	});
}
//live sub to all our follows (last 24 hours of events)
//live process all events into map of roots and replies
//sub to all roots
//fetch all missing roots
//sort roots by number of responses from our follows

let permaSub: Worker | undefined = undefined;

async function PermaSub(pubkeys: string[]) {
	if (pubkeys.length > 0) {
		if (permaSub) {
			permaSub.terminate();
		}
		const w = await import('./live_subs.ts?worker');
		permaSub = new w.default();
		permaSub.onmessage = (x: MessageEvent<number>) => {
			console.log(x.data);
		};
		let cmd = new Command('sub_to_pubkeys')
		cmd.pubkeys = pubkeys
		permaSub.postMessage(cmd);
	}
}
