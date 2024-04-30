import type { NostrEvent } from "nostr-tools";
import { writable, type Writable } from "svelte/store";

//export let currentPubkey = writable(undefined)

export let kind0 = writable(new Map<string, NostrEvent>)