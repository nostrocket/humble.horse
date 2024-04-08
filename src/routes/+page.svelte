<script lang="ts">
	import { Avatar } from "@nostr-dev-kit/ndk-svelte-components";
	import { ndk } from '$lib/ndk';
	import type { ExtendedBaseType, NDKEventStore } from '@nostr-dev-kit/ndk-svelte';
	import {
		NDKEvent,
		type Hexpubkey,
		type NDKSubscription,
		type NostrEvent,
		NDKRelay,
		NDKRelaySet,
		type NDKFilter
	} from '@nostr-dev-kit/ndk';
	import { onDestroy, onMount } from 'svelte';
	import { minimumScore, wot, wotFilter } from '@/stores/wot';
	import { Switch } from '$lib/components/ui/switch';
	import { currentUser, networkFollows, userFollows } from '@/stores/session';
	import EntriesList from '@/components/EntriesList.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '@/components/ui/button';
	import { derived, type Readable } from 'svelte/store';
	import { ArrowLeft } from 'radix-icons-svelte';
	import RenderNoteContent from "./RenderNoteContent.svelte";

	let entries: NDKEventStore<NDKEvent> | undefined;
	let events: Readable<ExtendedBaseType<NDKEvent>[]> | undefined;
	let roots: NDKEventStore<NDKEvent> | undefined;
	let categories: Readable<string[]> | undefined;
	let entriesVisible = 0;
	let entriesNotVisible = 0;

	let newQuery: string = '';
	let query: string = '';
	let category: string | undefined | null;
	let mounted = false;

	onDestroy(() => {
		entries?.unsubscribe();
	});

	let filter = derived(([userFollows, currentUser]), ([$f, $currentUser]) => {
		if ($f.size > 0 && $currentUser) {
			let filters: NDKFilter[] = [{ kinds: [1 as number], authors: [$currentUser.pubkey, ...$f] }];
			return filters;
		}
		return null;
	});

	// $: if (mounted) {

	// entries?.unsubscribe();
	// entries = $ndk.storeSubscribe([{ kinds: [30818 as number] }], { subId: 'entries' });

	// 	categories = derived(entries, ($entries) => {
	// 		if (!$entries) return [];
	// 		const cats = new Set<string>();
	// 		for (const event of $entries) {
	// 			const cat = event.tagValue('c');
	// 			if (cat) cats.add(cat);
	// 		}
	// 		return Array.from(cats);
	// 	});
	// }

	onMount(() => {
		mounted = true;
	});

	$: {
		if (mounted && $filter) {
			//const filters: NDKFilter[] = [{ kinds: [1 as number] }];

			entries = $ndk.storeSubscribe($filter, { subId: 'entries' });
		}
	}

	$: {
		if (entries && $entries) {
			//filter out anything that isn't a root event
			events = derived(entries, ($entries)=>{
				let shortlist:Set<string> = new(Set)
				for (let e of $entries) {
					if (!shortlist.has(e.id)) {
						if (e.tags.length == 0) {shortlist.add(e.id)} else {
							let found = false
							for (let t of e.tags) {
								if (t.includes("reply") || t.includes("root")) {
									found = true
								}
							}
							if (!found) {
								shortlist.add(e.id)
							}
						}
					}
					
				}
				return $entries.filter((e)=>{return shortlist.has(e.id)})
			})
		}
	}


</script>

{#if events && $events}
	{#each $events as e, i (e.id)}
	<div class="flex w-full items-start gap-2.5">
		<Avatar ndk={$ndk} user={e.author} class="rounded-full w-10 h-10 object-cover" />
		<!-- <img class="w-8 h-8 rounded-full" src="https://zenquotes.io/img/marcus-aurelius.jpg" alt="profile pic" /> -->
		<div class="flex flex-col leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700 my-2 overflow-hidden mr-2">
			<div class="flex items-center space-x-2 rtl:space-x-reverse">
			   <span class="text-sm font-semibold text-gray-900 dark:text-white">{e.author.profile?.displayName || e.author.profile?.name}</span>
			   <span class="text-sm font-normal text-gray-500 dark:text-gray-400">{new Date(e.created_at*1000).toLocaleString()}</span>
			</div>
			<p class="text-sm font-normal py-2.5 text-gray-900 dark:text-white"><RenderNoteContent inputString={e.content} /></p>
			<a class="text-xs text-orange-600" href="#" on:click={()=>{console.log(e.rawEvent())}}>print to console</a>
			<!-- <span class="text-sm font-normal text-gray-500 dark:text-gray-400">Delivered</span> -->
		 </div>
	</div>
	
	<!-- <div class=" bg-zinc-800 m-2 h-auto"><p>{e.content}</p><hr />{#each e.tags as t} <p>{t}</p> {/each} </div>-->
		
	
	{/each}

	<!-- <EntriesList {entries} bind:entriesVisible bind:entriesNotVisible /> -->
{/if}

<!-- {#if entries && $entries}
	{#each $entries as e}<div class=" bg-zinc-800 m-2 h-auto"><p>{e.content}</p><hr />{#each e.tags as t} <p>{t}</p> {/each}
		
	</div>
	{/each}

{/if} -->
