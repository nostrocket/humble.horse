import { NDKEvent, type NDKFilter, type NostrEvent } from '@nostr-dev-kit/ndk';
import NDKSvelte, { type ExtendedBaseType, type NDKEventStore } from '@nostr-dev-kit/ndk-svelte';
import { derived, get, writable, type Writable } from 'svelte/store';

import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie';
import {
	Command,
	EventTreeItem,
	FrontendData,
	WorkerData,
	type RecursiveEventMap
} from './firehose.types';
import { reducedRelays, seedRelays } from './seed_relays';
import { tagSplits } from './firehose.utils';

const __ndk = new NDKSvelte({
	//cacheAdapter: new NDKCacheAdapterDexie({ dbName: "firehose" }),
	explicitRelayUrls: ["wss://relay.nostrocket.org"],
	enableOutboxModel: true
});

const _ndk = writable(__ndk);

const ndk = get(_ndk);
let sub: NDKEventStore<ExtendedBaseType<NDKEvent>> | undefined = undefined;

let workerData: WorkerData | undefined; // = new ResponseData();
let frontendData = new FrontendData();
export let frontendStore = writable(frontendData);
const workerEventMap = new Map<string, NDKEvent>();
const mostRecentReplaceableEvents: Map<string, NDKEvent> = new Map();
const replaceableKinds = [0, 3];
const processedIdForKind: Record<number, string> = {};

let workerStore: Writable<WorkerData> | undefined; // =
let printed = 0;
let printedID = new Set<string>();
function init(pubkey?: string) {
	if (!workerData) {
		workerData = new WorkerData(pubkey);
		workerStore = writable(workerData);
		frontendStore.subscribe((data) => {
			postMessage(data);
		});
		workerStore.subscribe((response) => {
			let n = new FrontendData();
			n.rootEvents = Array.from(response.rootEvents);
			n.replies = new Map();
			n.events = response.events;
			for (let [id, event] of response.events) {
				if (event.kind == 1) {
					let _ndk_event = new NDKEvent(undefined, event);
					let tagsForEvent = new tagSplits(_ndk_event);
					if (tagsForEvent.unknown.size > 0) {
						if (printed < 20 && !printedID.has(_ndk_event.id)) {
							printed++;
							printedID.add(_ndk_event.id);
							console.log('unknown tag detected', printed, _ndk_event.rawEvent());
						}
					}
					if (
						(tagsForEvent.replies.size == 0 && tagsForEvent.unlabelled.size > 1) ||
						tagsForEvent.replies.size > 1
					) {
						let events = new Map<string, NDKEvent>();
						let missing = new Set<string>();
						let possibleReplies = new Set([...tagsForEvent.unlabelled, ...tagsForEvent.replies]);
						for (let _id of possibleReplies) {
							let _event = response.events.get(_id);
							if (_event) {
								events.set(_id, new NDKEvent(undefined, _event));
							}
							if (!_event) {
								missing.add(_id);
							}
						}
						if (missing.size == 0 && events.size > 0) {
							let allTaggedEvents = new Set<string>();
							for (let [_, e] of events) {
								let splits = new tagSplits(e);
								for (let id of splits.All()) {
									allTaggedEvents.add(id);
								}
							}
							let tagsThatAreNotInTaggedEvents = new Set<string>();
							for (let id of possibleReplies) {
								if (!allTaggedEvents.has(id)) {
									tagsThatAreNotInTaggedEvents.add(id);
								}
							}
							if (tagsThatAreNotInTaggedEvents.size == 1) {
								//console.log(96);
								tagsForEvent.replies = new Set([tagsThatAreNotInTaggedEvents][0]);
							}
							//if more than one in replies: find all the tagged events and see which tag among all these events is unique (the unique one is probably the reply, and the repeated one(s) are the root or further up in the thread)
							//console.log('implement me');
						} else {
							//console.log(missing)
							//todo: fetch missing events by ID
						}
					}
					if (tagsForEvent.replies.size == 1) {
						let existing = n.replies.get([...tagsForEvent.replies][0]);
						if (!existing) {
							existing = [];
						}
						existing.push(event.id!);
						n.replies.set([...tagsForEvent.replies][0], existing);
					}
				}
			}
			n.rootEvents.sort((a, b) => {
				let a_replies = n.replies.get(a);
				let b_replies = n.replies.get(b);
				if (a_replies && b_replies) {
					return b_replies.length - a_replies.length;
				}
				if (!a_replies && b_replies) {
					return 1;
				}
				if (!b_replies && a_replies) {
					return -1;
				}
				return 0;
			});
			frontendStore.set(n);
		});

		let rootEvents = derived(workerStore!, ($responseStore) => {
			return $responseStore.rootEvents.size;
		});

		rootEvents.subscribe(() => {
			updateEventMap();
		});

		let masterFollows = derived(workerStore, ($responseStore) => {
			if ($responseStore.masterPubkey) {
				return $responseStore.followLists.get($responseStore.masterPubkey)?.size;
			}
		});

		masterFollows.subscribe(() => {
			let $responseStore = get(workerStore!);
			if ($responseStore.masterPubkey) {
				let follows = $responseStore.followLists.get($responseStore.masterPubkey);
				if (follows) {
					subscribe($responseStore.masterPubkey, [...follows]);
				}
			}
		});
		let rootCount = derived(workerStore, ($responseStore) => {
			if ($responseStore.masterPubkey) {
				return $responseStore.etags.size;
			}
		});
		let lastUpdate = 0;
		rootCount.subscribe((num) => {
			if (num && num - lastUpdate > 200) {
				lastUpdate = num;
				subscribe();
			}
		});
	}
}

let subscribe = (pubkey?: string, pubkeys?: string[]) => {
	if (pubkey && pubkey.length != 64) {
		throw new Error('invalid pubkey');
	}
	if (!workerData && !pubkey) {
		return;
	}
	if (!workerData && pubkey) {
		init(pubkey);
	}
	if (!workerData) {
		throw new Error('this should not happen');
	}
	if (connectionStatus != 2) {
		workerStore!.update((current) => {
			current.errors.push(new Error('not connected!'));
			return current;
		});
		return;
	}
	if (pubkey) {
		workerData.masterPubkey = pubkey;
	}
	if (!sub && pubkey) {
		sub = ndk.storeSubscribe(
			{ kinds: [3], authors: [pubkey] },
			{ subId: 'master', closeOnEose: false }
		);
		sub.subscribe((events) => {
			for (let event of events) {
        //experimentalPub(event)
				workerEventMap.set(event.id, event);
				let shouldPush = true;
				if (replaceableKinds.includes(event.kind!)) {
					let existing = mostRecentReplaceableEvents.get(event.deduplicationKey());
					if (existing && event.created_at! < existing.created_at!) {
						shouldPush = false;
					} else {
						mostRecentReplaceableEvents.set(event.deduplicationKey(), event);
					}
				}
				if (shouldPush) {
					workerData!.PushEvent(event.rawEvent());
				}
			}
			workerStore!.update((current) => {
				current.rawCount = events.length;
				if (sub?.subscription) {
					for (let [s, relay] of sub.subscription.pool.relays) {
						current.connections.set(s, relay.activeSubscriptions().size);
					}
				} else {
					current.connections = new Map();
				}
				return current;
			});
		});
	} else if (sub) {
		sub.unsubscribe();
		let newFilters: NDKFilter[] = [];
		let authors = new Set<string>();
		if (pubkeys) {
			authors = new Set<string>(pubkeys);
		}
		if (pubkey) {
			authors.add(pubkey);
		}
		if (sub.filters) {
			for (let fi of sub.filters) {
				if (fi.authors) {
					for (let author of fi.authors) {
						authors.add(author);
					}
				}
			}
		}
		newFilters = [];
		_ndk.update((existing) => {
			if (workerData) {
				for (let r of workerData.relays) {
					existing.addExplicitRelay(r, undefined, true);
				}
			}
			return existing;
		});
		let $frontendData = get(frontendStore);
		let etags = [...Array.from(workerData.etags, ([id, _]) => id)];
		let roots = new Set<string>([...Array.from($frontendData.replies, ([id, _]) => id)]);
		let missingRoots = [];
		for (let id of roots) {
			if (!workerData.events.get(id)) {
				missingRoots.push(id);
			}
		}
		let missingEventsSorted = missingRoots.toSorted((a, b) => {
			return $frontendData.replies.get(a)!.length - $frontendData.replies.get(b)!.length;
		});

		if (missingEventsSorted.length > 200) {
			missingEventsSorted.length = 200;
		}

		// missingEventsSorted.forEach((id)=>{
		//   console.log(267, get(frontendStore).replies.get(id)!.length)
		// })

		let truncatedAuthors = [];
		for (let a of authors) {
			truncatedAuthors.push(a.substring(0, 32));
		}

		//console.log(etags)
		newFilters.push({ kinds: [1, 7], authors: truncatedAuthors, since: 1713087410 });
		//newFilters.push({ kinds: [10002], authors: truncatedAuthors });
		//newFilters.push({ kinds: [0, 3], authors: truncatedAuthors });
		//newFilters.push({ kinds: [1], authors: truncatedAuthors, since: 1713087410});
		newFilters.push({ kinds: [1], '#e': [...roots] });
		if (missingEventsSorted.length > 0) {
			//   let i = 0
			//   for (let id of missingEventsSorted)
			//   newFilters.push({ids: [id]});
			// i++
			//let subFilters = [];
			newFilters.push({ ids: missingEventsSorted });
			// ndk.fetchEvents(subFilters).then((r) => {
			//   console.log(r);
			//   r.forEach(event=>{
			//     workerEventMap.set(event.id, event);
			//     let shouldPush = true;
			//     if (replaceableKinds.includes(event.kind!)) {
			//       let existing = mostRecentReplaceableEvents.get(event.deduplicationKey());
			//       if (existing && event.created_at! < existing.created_at!) {
			//         shouldPush = false;
			//       } else {
			//         mostRecentReplaceableEvents.set(event.deduplicationKey(), event);
			//       }
			//     }
			//     if (shouldPush) {
			//       workerData!.PushEvent(event.rawEvent());
			//     }
			//   })
			// });
			//experimentalSub(subFilters);
		}

		// newFilters.push({ kinds: [3], authors: [pubkey] });
		// for (let author of authors) {
		// 	newFilters.push({ kinds: [0, 1, 3, 7, 10002], authors: [author] });
		// }

		sub.changeFilters(newFilters);
		//console.log(261)
		console.log(sub.filters);

		sub.startSubscription();
	}
};

let connectionStatus = 0;

onmessage = (m: MessageEvent<Command>) => {
	if (!workerData) {
		init();
	}
	if (m.data.command == 'connect') {
		ndk_fetcher.connect(2000);
		if (connectionStatus == 0) {
			workerData!.connected = 1;
			connectionStatus = 1;
			__ndk.connect(2000).then(() => {
				workerData!.connected = 2;
				connectionStatus = 2;
				if (m.data.pubkey) {
					subscribe(m.data.pubkey);
				}
			});
		}
	}

	if (m.data.command == 'start') {
		if (m.data.pubkey) {
			subscribe(m.data.pubkey);
		}
	}
	if (m.data.command == 'stop') {
		if (sub) {
			sub.unsubscribe();
		}
	}
	if (m.data.command == 'print') {
		updateEventMap();
	}
};

function updateEventMap() {
	//todo: crawl over all events and fetch parents up to the root if we don't already have them
	//todo: find all replies to root events (use outbox mode too)
	//these need to be live subs when user is viewing a thread, so we need to add/remove filters based on what they're looking at.
	let m: RecursiveEventMap = new Map();
	for (let id of workerData!.rootEvents) {
		m.set(id, new EventTreeItem(workerEventMap.get(id)!.rawEvent()));
	}
	workerData!.recursiveEvents.children = iterate(m);
}

function iterate(m: Map<string, EventTreeItem>): Map<string, EventTreeItem> {
	for (let [id, treeItem] of m) {
		let children: Map<string, EventTreeItem> = new Map();
		let _children = workerData!.etags.get(treeItem.event.id!);
		if (_children) {
			for (let eventID of _children) {
				let _child_event = workerData!.events.get(eventID);
				if (_child_event && _child_event.kind == 1) {
					children.set(eventID, new EventTreeItem(_child_event));
				}
			}
		}
		treeItem.children = iterate(children);
		m.set(id, treeItem);
	}
	return m;
}
const ndk_fetcher = new NDKSvelte({
	//cacheAdapter: new NDKCacheAdapterDexie({ dbName: "firehose" }),
	explicitRelayUrls: seedRelays,
	enableOutboxModel: true
});

const ndk_pub = new NDKSvelte({
	//cacheAdapter: new NDKCacheAdapterDexie({ dbName: "firehose" }),
	explicitRelayUrls: ['wss://relay.nostrocket.org'],
	enableOutboxModel: true
});

let pubbing = false;

let fetching = false;

// let experimentalSub = (filter: NDKFilter[]) => {
// 	// console.log(375,filter)
// 	// ndk.fetchEvents(filter).then((r)=>{
// 	//   console.log(r)
// 	// })
// 	//ndk_fetcher.connect(5000).then(() => {
// 	console.log(380, filter);
//   if (!fetching) {
//     fetching = true
//     ndk_fetcher.fetchEvents(filter).then((r) => {
//       fetching = false
//       console.log(r);
//       r.forEach((event) => {
//         workerEventMap.set(event.id, event);
//         let shouldPush = true;
//         if (replaceableKinds.includes(event.kind!)) {
//           let existing = mostRecentReplaceableEvents.get(event.deduplicationKey());
//           if (existing && event.created_at! < existing.created_at!) {
//             shouldPush = false;
//           } else {
//             mostRecentReplaceableEvents.set(event.deduplicationKey(), event);
//           }
//         }
//         if (shouldPush) {
//           workerData!.PushEvent(event.rawEvent());
//         }
//       });
//     });
//   }}

let experimentalPub = (event: NDKEvent) => {
  if (!pubbing) {
    pubbing = true
    ndk_pub.connect(5000).then(() => {
      pubbing = false
      event.ndk = ndk_pub
      event.publish().then(x=>{
        console.log(x)
      })
    })
  }
};
