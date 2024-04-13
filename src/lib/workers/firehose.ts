import type { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";
import NDKSvelte, {
  type ExtendedBaseType,
  type NDKEventStore,
} from "@nostr-dev-kit/ndk-svelte";
import { derived, get, writable, type Writable } from "svelte/store";

import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";
import { Command, EventTreeItem, ResponseData, type RecursiveEventMap } from "./firehose.types";

const _ndk = writable(
  new NDKSvelte({
    //cacheAdapter: new NDKCacheAdapterDexie({ dbName: "wiki" }),
    explicitRelayUrls: [
      "wss://purplepag.es",
      "wss://relay.nostr.band",
      //  "wss://nos.lol",
      //   "wss://relay.wikifreedia.xyz",
      "wss://relay.nostrocket.org",
      "wss://search.nos.today",
      "wss://relay.damus.io",
      //   "wss://relay.nostr.bg",
      "wss://relay.snort.social",
      //   "wss://offchain.pub",
      "wss://relay.primal.net",
      // "wss://pyramid.fiatjaf.com",
    ],
    enableOutboxModel: false,
  })
);

const ndk = get(_ndk);
let sub: NDKEventStore<ExtendedBaseType<NDKEvent>> | undefined = undefined;

let responseData: ResponseData | undefined; // = new ResponseData();
const workerEventMap = new Map<string, NDKEvent>();
const mostRecentReplaceableEvents: Map<string, NDKEvent> = new Map();
const replaceableKinds = [0, 3];
const processedIdForKind: Record<number, string> = {};

let responseStore: Writable<ResponseData> | undefined; // =
// responseStore.subscribe((response) => {
//   postMessage(response);
// });

function init(pubkey?: string) {
  if (!responseData) {
    responseData = new ResponseData(pubkey);
    responseStore = writable(responseData);
    responseStore.subscribe((response) => {
      postMessage(response);
    });

    let rootEvents = derived(responseStore!, ($responseStore) => {
      return $responseStore.rootEvents.size;
    });

    rootEvents.subscribe(() => {
      updateEventMap();
    });

    // let _masterFollows = writable(responseData.followLists.get(responseData.masterPubkey))
    // let masterFollows = derived(_masterFollows, ($mfs)=>{
    //   if ($mfs) {
    //     return $mfs.size
    //   } else {
    //     return 0
    //   }
    // })

    let masterFollows = derived(responseStore, ($responseStore) =>{
        if ($responseStore.masterPubkey) {
            return $responseStore.followLists.get($responseStore.masterPubkey)?.size
        }
    })

    masterFollows.subscribe(() => {
      console.log(78)
      let $responseStore = get(responseStore!);
      if ($responseStore.masterPubkey) {
        let follows = $responseStore.followLists.get($responseStore.masterPubkey);
        if (follows) {
          subscribe($responseStore.masterPubkey, [...follows]);
        }
      }

    });
  }
}

let subscribe = (pubkey: string, pubkeys?: string[]) => {
  if (pubkey.length != 64) {
    throw new Error("invalid pubkey");
  }
  if (!responseData) {
    init(pubkey);
  }
  if (!responseData) {throw new Error("this should not happen")}
  if (connectionStatus != 2) {
    responseStore!.update((current) => {
      current.errors.push(new Error("not connected!"));
      return current;
    });
    return;
  }
  if (pubkey) {responseData.masterPubkey = pubkey}
  if (!sub) {
    sub = ndk.storeSubscribe(
      { kinds: [0, 1, 3, 7], authors: [pubkey] },
      { subId: "master" }
    );
    sub.subscribe((events) => {
      for (let event of events) {
        if (!workerEventMap.has(event.id)) {
          workerEventMap.set(event.id, event);
        }
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
          responseData!.PushEvent(event.rawEvent());
        }
      }
      responseStore!.update((current) => {
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
  } else {
    let newFilters: NDKFilter[] = [];
    let authors = new Set<string>();
    if (pubkeys) {
      authors = new Set<string>(pubkeys);
    }
    authors.add(pubkey);
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
    newFilters.push({ kinds: [3], authors: [pubkey] });
    for (let author of authors) {
      newFilters.push({ kinds: [0, 1, 3, 7], authors: [author] });
    }
    sub.changeFilters(newFilters);
    console.log(sub.filters)
    sub.unsubscribe();
    sub.startSubscription();
  }
};

let connectionStatus = 0;

onmessage = (m: MessageEvent<Command>) => {
    if (!responseData) {
        init()
    }
  if (m.data.command == "connect") {
    if (connectionStatus == 0) {
        responseData!.connected = 1
      connectionStatus = 1;
      ndk.connect(5000).then(() => {
        responseData!.connected = 2
        connectionStatus = 2;
        if (m.data.pubkey) {
            subscribe(m.data.pubkey);
        }
      });
    }
  }

  if (m.data.command == "start") {
    if (m.data.pubkey) {
      subscribe(m.data.pubkey);
    }
  }
  if (m.data.command == "stop") {
    if (sub) {
      sub.unsubscribe();
    }
  }
  if (m.data.command == "print") {
    updateEventMap();
  }
};

function updateEventMap() {
  //todo: crawl over all events and fetch parents up to the root if we don't already have them
  //todo: find all replies to root events (use outbox mode too)
  //these need to be live subs when user is viewing a thread, so we need to add/remove filters based on what they're looking at.
  let m: RecursiveEventMap = new Map();
  for (let id of responseData!.rootEvents) {
    m.set(id, new EventTreeItem(workerEventMap.get(id)!.rawEvent()));
  }
  responseData!.recursiveEvents.children = iterate(m);
}

function iterate(m: Map<string, EventTreeItem>): Map<string, EventTreeItem> {
  for (let [id, treeItem] of m) {
    let children: Map<string, EventTreeItem> = new Map();
    let _children = responseData!.etags.get(treeItem.event.id!);
    if (_children) {
      for (let eventID of _children) {
        let _child_event = responseData!.events.get(eventID);
        if (_child_event) {
          children.set(eventID, new EventTreeItem(_child_event));
        }
      }
    }
    treeItem.children = iterate(children);
    m.set(id, treeItem);
  }
  return m;
}