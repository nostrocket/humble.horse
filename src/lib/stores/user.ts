import { writable, type Writable } from "svelte/store";

export let currentPubkey = writable(undefined)