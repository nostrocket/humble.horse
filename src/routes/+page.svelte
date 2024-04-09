<script lang="ts">
	import { Avatar, Name } from '@nostr-dev-kit/ndk-svelte-components';
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
	import { derived, writable, type Readable, type Writable } from 'svelte/store';
	import { ArrowLeft } from 'radix-icons-svelte';
	import RenderNoteContent from './RenderNoteContent.svelte';
	import type { PostMessage, PostMessageDataRequest, PostMessageDataResponse } from '@/my.worker';

	// const onWorkerMessage = ({
	// 	data: {data}
	// }: MessageEvent<PostMessage<PostMessageDataResponse>>) => {
	// 	console.log(data);
	// };

	const onWorkerMessage = () => {
		console.log(35);
	};

	let syncWorker: Worker;
	const loadWorker = async () => {
		const SyncWorker = await import('$lib/my.worker?worker');
		syncWorker = new SyncWorker.default();
		syncWorker.onmessage = onWorkerMessage;
	};

	let mounted = false;
	onMount(() => {
		mounted = true;
		//firehose = $ndk.storeSubscribe([{ authors: ["d91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075"] }], { subId: 'firehose' });
		loadWorker().then(() => {
			const message: PostMessage<PostMessageDataRequest> = {
				data: { text: 'start' }
			};
			syncWorker.postMessage(message);
			//syncWorker.postMessage("start")
		});
	});

	let filter = derived([userFollows, currentUser], ([$f, $currentUser]) => {
		let authors: string[] = [];
		if ($f.size > 0 && $currentUser) {
			authors.push($currentUser.pubkey, ...$f);
		}
		if (authors.length == 0) {
			authors.push('d91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075');
		}
		let filters: NDKFilter[] = [{ authors: authors }];
		return filters;
	});

	let firehoseMap = writable(new Map<string, NDKEvent>());

	let firehoseupdates = 0;
	let firehose: NDKEventStore<ExtendedBaseType<NDKEvent>> | undefined;

	let started = false;

	let tick = writable(0);
	// $: {
	// 	setInterval(
	// 		() =>
	// 			tick.update((c) => {
	// 				c++;
	// 				return c;
	// 			}),
	// 		120000
	// 	);
	// }
	$: {
		if (mounted && $filter && !started) {
			started = true;
			//firehose = $ndk.storeSubscribe([{ authors: ["d91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075"] }], { subId: 'firehose' });
			// firehose.subscribe((x) => {
			// 	x.forEach((y) => {
			// 		// firehoseMap.update((existing) => {
			// 		// 	if (!existing.has(y.id)) {
			// 		// 		existing.set(y.id, y);
			// 		// 	}
			// 		// 	return existing;
			// 		// });
			// 	});
			// });
			// let _firehose = derived([filter, tick], ([$filter]) => {
			// 	if (!firehose) {
			// 		//firehose = $ndk.storeSubscribe($filter, { subId: 'firehose' });
			// 	}
			// 	console.log(78);

			// 	// firehose.subscribe((x) => {
			// 	// 	x.forEach((y) => {
			// 	// 		// firehoseMap.update((existing) => {
			// 	// 		// 	if (!existing.has(y.id)) {
			// 	// 		// 		existing.set(y.id, y);
			// 	// 		// 	}
			// 	// 		// 	return existing;
			// 	// 		// });
			// 	// 	});
			// 	// });
			// 	return firehoseupdates++;
			// });
			// _firehose.subscribe((updates) => {
			// 	console.log(updates);
			// });
		}
	}

	let kinds = derived(firehoseMap, ($firehoseMap) => {
		let k = new Map<number, number>();
		// for (let [_, e] of $firehoseMap) {
		// 	let existing = k.get(e.kind!)
		// 	if (!existing) {
		// 		k.set(e.kind!, 1)
		// 	} else {
		// 		console.log(97)
		// 		k.set(e.kind!, existing++)
		// 	}
		// }
		return k;
	});

	let displayed = writable<Set<string>>(new Set());

	let roots = derived(firehoseMap, ($fh) => {
		let shortlist: Set<string> = new Set();
		for (let [id, e] of $fh) {
			if (!shortlist.has(e.id)) {
				if (e.tags.length == 0) {
					shortlist.add(e.id);
				} else {
					let found = false;
					for (let t of e.getMatchingTags('e')) {
						if (!t.includes('mention')) {
							found = true;
						}
					}
					if (!found) {
						shortlist.add(e.id);
					}
				}
			}
		}
		return shortlist;
	});

	let replies = derived([firehoseMap, roots], ([$fhm, $roots]) => {});

	let displayQueue = derived([firehoseMap, roots, replies], ([$f, $ro, $re]) => {
		//for each reply, get every event ID with label root, tally these up in a map. For any that are missing from firehose, subscribe to get them.
		//create a rank order of root events to display (ranked by number of replies from people we follow)
		//do the same with reacts and reposts but weigh these differently, maybe 10 reacts is 1 reply.
		//idea: create nested data structure for all events. Top level are events that don't reply or root or plaintag any other events (mentions are ok)
	});

	onDestroy(() => {
		firehose?.unsubscribe();
	});
</script>

<br />
{#if firehoseMap && $firehoseMap}fireHoseMap:{$firehoseMap.size}<br />{/if}
{#if firehose && $firehose}
	fireHose:{$firehose.length}<br />{/if}
{#if roots && $roots}roots:{$roots.size}<br />{/if}
{#if kinds && $kinds}{#each $kinds as [kind, count]}KIND: {kind} COUNT: {count}<br />{/each}{/if}
ACTIVE SUBS
{#each $ndk.pool.relays.values() as relay}{relay.activeSubscriptions()}{/each}
<!-- {#if events && $events}
	{#each $events as e, i (e.id)}
		<div class="flex w-full items-start gap-2.5">
			<Avatar ndk={$ndk} user={e.author} class="rounded-full w-10 h-10 object-cover" />
			<div
				class="flex flex-col leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700 my-2 overflow-hidden mr-2"
			>
				<div class="flex items-center space-x-2 rtl:space-x-reverse">
					<span class="text-sm font-semibold text-gray-900 dark:text-white"
						><Name ndk={$ndk} user={e.author}></Name></span
					>
					<span class="text-sm font-normal text-gray-500 dark:text-gray-400"
						>{new Date(e.created_at * 1000).toLocaleString()}</span
					>
				</div>
				<p class="text-sm font-normal py-2.5 text-gray-900 dark:text-white">
					<RenderNoteContent inputString={e.content} />
				</p>
				<a
					class="text-xs text-orange-600"
					href="#"
					on:click={() => {
						console.log(e.rawEvent());
					}}>print to console</a
				>
				<span class="text-sm font-normal text-gray-500 dark:text-gray-400">Metadata</span>
			</div>
		</div>
	{/each}
{/if} -->

<!-- {#if entries && $entries}
	{#each $entries as e}<div class=" bg-zinc-800 m-2 h-auto"><p>{e.content}</p><hr />{#each e.tags as t} <p>{t}</p> {/each}
		
	</div>
	{/each}

{/if} -->
