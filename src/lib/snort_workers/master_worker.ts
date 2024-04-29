import { seedRelays } from '@/snort_workers/seed_relays';
import type { NostrEvent } from '@nostr-dev-kit/ndk';
import { NostrSystem, RequestBuilder, type QueryLike } from '@snort/system';
import { BloomFilter } from 'bloomfilter';
import { derived, writable } from 'svelte/store';
import { Command, FrontendData, WorkerData } from './types';
import {
	bloomFromKind18100,
	execTime,
	followsFromKind3,
	getNostrEvent,
	updateRepliesInPlace
} from './utils';

let workerData = new WorkerData();
let workerDataStore = writable(workerData);

const sys = new NostrSystem({
	checkSigs: false
	// automaticOutboxModel: true,
	// buildFollowGraph: true,
});

let connecting = false;

async function connect() {
	let end = execTime('21, connect');
	if (!connecting) {
		connecting = true;
		seedRelays.forEach((r) => sys.ConnectToRelay(r, { read: true, write: false }));
	}
	end();
}

workerDataStore.subscribe((data) => {
	let end = execTime('28 workerDataStore.subscribe');
	let fed = new FrontendData();
	fed.baseFollows = data.ourFollows;
	let roots: NostrEvent[] = [];
	let inBloom: string[] = [];
	for (let r of data.roots) {
		if (!data.ourBloom.test(r)) {
			let re = data.events.get(r);
			if (!re) {
				throw new Error('missing event, this should not happen, bug!');
			}
			roots.push(re!);
		} else {
			inBloom.push(r);
			//console.log(42)
		}
	}
	fed.roots = roots.toSorted((a, b) => {
		let a_replies = data.replies.get(a.id!);
		let b_replies = data.replies.get(b.id!);
		if (a_replies && b_replies) {
			return b_replies.size - a_replies.size;
		}
		if (!a_replies && b_replies) {
			return 1;
		}
		if (!b_replies && a_replies) {
			return -1;
		}
		return 0;
	});
	fed.replies = data.replies;
	fed.events = data.events;
	fed._bloomString = JSON.stringify([].slice.call(data.ourBloom.buckets));
	let testbloom = new BloomFilter(JSON.parse(fed._bloomString), 32);
	//console.log(data.ourBloom.test(inBloom[0]), testbloom.test(inBloom[0]))
	fed.ourBloom = data.ourBloom; //new BloomFilter(JSON.parse(fed._bloomString), 32)
	postMessage(fed);
	end();
});

let lengthOfFollows = derived(workerDataStore, ($wds) => {
	return $wds.ourFollows.size;
});

let q_subToFollows: QueryLike;
lengthOfFollows.subscribe((x) => {
	let end = execTime('69, lengthOfFollows.subscribe');
	console.log('follows updated');
	if (x > 0) {
		const rb = new RequestBuilder('sub-to-follows');
		rb.withFilter()
			.authors([...workerData.ourFollows, workerData.ourPubkey()])
			.kinds([1, 7]);
		rb.withOptions({ leaveOpen: true });
		if (q_subToFollows) {
			q_subToFollows.cancel();
		}
		q_subToFollows = sys.Query(rb);
		q_subToFollows.on('event', (evs): void => {
			let m = new Map<string, NostrEvent>();
			for (let e of evs) {
				m.set(e.id, e);
			}
			if (m.size > 0) {
				updateReplies(m);
			}
		});
	}
	end();
});

//contract
onmessage = (m: MessageEvent<Command>) => {
	let end = execTime('88, onmessage');
	if (m.data.command == 'ping') {
		console.log(93, 'ping');
	}
	if (m.data.command == 'start') {
		start(m.data.pubkey);
	}
	if (m.data.command == 'push_event') {
		console.log(96);
		let map = new Map<string, NostrEvent>();
		if (m.data.event) {
			for (let e of m.data.event) {
				map.set(e.id, e);
			}
			if (map.size > 0) {
				updateReplies(map);
			}
		}
	}
	end();
};

let replaceables = [3, 10002, 18100];
//connect to seed relays, get our follows and relays.
async function start(pubkey?: string, pubkeys?: string[]) {
	connect();
	return new Promise((resolve, reject) => {
		if (pubkey) {
			workerData.setOurPubkey(pubkey);
		} else {
			pubkey = workerData.ourPubkey();
		}

		(async () => {
			let end = execTime('125 async start');
			const rb = new RequestBuilder('fetch-initial-data');
			let _pukeys: string[] = [];
			let kinds = [3, 10002];
			if (pubkeys) {
				_pukeys = pubkeys;
			}
			if (pubkey) {
				_pukeys.push(pubkey);
			}
			if (pubkey && !pubkeys) {
				kinds = [3, 10002, 1, 7, 18100];
			}
			rb.withFilter().authors(_pukeys).kinds(kinds);
			rb.withOptions({ leaveOpen: false });

			const _q = sys.Query(rb);
			_q.on('event', (evs): void => {
				let updated = new Set<string>();
				for (let e of evs) {
					if (replaceables.includes(e.kind)) {
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
						event = workerData.latestReplaceable.get(pubkey)?.get('18100');
						if (event) {
							let b = bloomFromKind18100(event)
							if (b) {
								workerData.ourBloom = b
								dirty = true
							}
						}
					}
				}
				if (dirty) {
					workerDataStore.update((d) => {
						return d;
					});
				}
				end();
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

//let permaSub: Worker | undefined = undefined;

function updateReplies(newEvents?: Map<string, NostrEvent>) {
	workerDataStore.update((current) => {
		let end = execTime('updateReplies');
		if (newEvents) {
			current.events = new Map([...newEvents, ...current.events]);
		}
		updateRepliesInPlace(current);
		end();
		return current;
	});
}

// async function PermaSub(pubkeys: string[]) {
// 	if (pubkeys.length > 0) {

// 		if (permaSub) {
// 			permaSub.terminate();
// 		}
// 		permaSub = new WorkerPubkeys();
// 		permaSub.onmessage = (x: MessageEvent<Map<string, NostrEvent>>) => {
// 			updateReplies(x.data)
// 		};
// 		let cmd = new Command('sub_to_pubkeys');
// 		cmd.pubkeys = pubkeys;
// 		permaSub.postMessage(cmd);
// 	}
// }

let numberOfMissingEvents = derived(workerDataStore, ($wds) => {
	return $wds.missingEvents.size;
});

//let fetchEventsWorker: Worker | undefined = undefined;

let q_missingEvents: QueryLike;
// numberOfMissingEvents.subscribe((n) => {
// 	let end = execTime("298 numberOfMissingEvents")
// 	if (n > 0) {
// 		const rb = new RequestBuilder('fetch-missing-events');
// 		rb.withFilter().ids([...workerData.missingEvents])
// 		rb.withOptions({ leaveOpen: false });
// 		if (q_missingEvents) {q_missingEvents.cancel()}
// 		q_missingEvents = sys.Query(rb);
// 		q_missingEvents.on('event', (evs): void => {
// 			let m = new Map<string, NostrEvent>()
// 			for (let e of evs) {
// 				m.set(e.id, e)
// 			}
// 			if (m.size > 0) {
// 				updateReplies(m)
// 			}
// 		})
// 	}
// 	end()
// });

export default {};
