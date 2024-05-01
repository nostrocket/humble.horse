import type { NostrEvent } from "nostr-tools";
import { derived, writable, type Readable, type Writable } from "svelte/store";

export let shortListLength: Readable<number>;

let _stableShortlist: NostrEvent[] = [];
export let stableShortList: Writable<NostrEvent[]> = writable(_stableShortlist);

export let threadParentIDChain = writable(['root']);

export let threadParentID = derived(threadParentIDChain, ($tpi) => {
    return $tpi[$tpi.length - 1];
});