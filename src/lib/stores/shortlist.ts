import type { NostrEvent } from "nostr-tools";
import { writable, type Readable, type Writable } from "svelte/store";

export let shortListLength: Readable<number>;

let _stableShortlist: NostrEvent[] = [];
export let stableShortList: Writable<NostrEvent[]> = writable(_stableShortlist);