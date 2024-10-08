<script lang="ts">
	import Button from '@/components/Button.svelte';
	import ChatLayout from '@/components/ChatLayout.svelte';
	import Coracle from '@/components/Coracle.svelte';
	import MessageInput from '@/components/MessageInput.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import { currentUser, ndk } from '@/ndk/ndk';
	import { PushEvent, FrontendDataStore as feds, viewed } from '@/snort_workers/main';
	import { updateRepliesInPlace } from '@/snort_workers/utils';
	import { stableShortList, threadParentID, threadParentIDChain } from '@/stores/shortlist';
	import { NDKEvent, type NDKTag } from '@nostr-dev-kit/ndk';
	import NDKSvelte from '@nostr-dev-kit/ndk-svelte';
	import { RequestBuilder, type QueryLike, type Tag } from '@snort/system';
	import { BloomFilter } from 'bloomfilter';
	import type { NostrEvent } from 'nostr-tools';
	import { onMount } from 'svelte';
	import { ArrowTurnUpSolid } from 'svelte-awesome-icons';
	import { derived, writable } from 'svelte/store';
	import RenderKind1 from './RenderKind1.svelte';
	import RenderKind1AsThreadHead from './RenderKind1AsThreadHead.svelte';
	import { System } from './snort';

	let messageInputContent = '';

	let localEvents = writable(new Map<string, NostrEvent>());

	let FrontendDataStore = derived([feds, localEvents], ([$feds, $localEvents]) => {
		$feds.events = new Map([...$feds.events, ...$localEvents]);
		updateRepliesInPlace($feds);
		return $feds;
	});

	function pop() {
		threadParentIDChain.update((existing) => {
			existing.pop();
			return existing;
		});
	}

	let renderQueue = derived([FrontendDataStore, threadParentID], ([$fds, $parentID]) => {
		if ($parentID == 'root') {
			let spliced: string[] = [];
			let maxLength = Math.max($fds.rootsByKeyword.length, $fds.rootsByReplies.length);
			for (let i = 0; i < maxLength; i++) {
				if (i < $fds.rootsByKeyword.length) {
					spliced.push($fds.rootsByKeyword[i]);
				}
				if (i < $fds.rootsByReplies.length) {
					spliced.push($fds.rootsByReplies[i]);
				}
			}
			spliced = [...new Set(spliced)];

			let r = Array.from(spliced, (r) => {
				return $fds.events.get(r);
			});

			//console.log(r.length)
			return r;
		} else {
			let workerSet = $fds.replies.get($parentID);
			let fullSet = new Map<string, NostrEvent>();
			if (workerSet) {
				for (let id of workerSet) {
					let ev = $fds.events.get(id);
					if (ev) {
						fullSet.set(id, ev);
					} else {
						throw new Error('this should not happen');
					}
				}
			}
			//todo: add live subscriptions
			return Array.from(fullSet, ([id, ev]) => ev).toSorted((a, b) => {
				return a.created_at - b.created_at;
			});
		}
	});

	let q: QueryLike;

	let firstRun = true;

	threadParentID.subscribe((parentID) => {
		if (firstRun) {
			firstRun = false;
		} else {
			stableShortList.set([]);
			if (parentID != 'root' && parentID.length == 64) {
				if (q) {
					q.cancel();
				}
				(async () => {
					// ID should be unique to the use case, this is important as all data fetched from this ID will be merged into the same NoteStore
					const rb = new RequestBuilder(`get-${parentID}`);
					rb.withFilter().tag('e', [parentID]).kinds([1]);
					rb.withOptions({ leaveOpen: false });
					q = System.Query(rb);
					// basic usage using "onEvent", fired every 100ms
					q.on('event', (evs) => {
						if (evs.length > 0) {
							localEvents.update((existing) => {
								for (let e of evs) {
									existing.set(e.id, e);
								}
								return existing;
							});
							PushEvent(evs);
						}

						// something else..
					});
				})();
			}
		}
	});

	renderQueue.subscribe((q) => {});

	//remove viewed and add new items that haven't been viewed
	let shortListLength = derived(
		[renderQueue, viewed, threadParentID],
		([$renderQ, $viewed, $parentID]) => {
			let dirty = false;
			let updated: NostrEvent[] = [];
			for (let e of $stableShortList) {
				if (!$viewed.has(e.id) || $parentID != 'root') {
					//console.log(72, e.id);
					updated.push(e);
				} else {
					dirty = true;
				}
			}
			let needed = 6 - updated.length;
			if (needed > 0 || $parentID != 'root') {
				let pushed = 0;
				for (let e of $renderQ) {
					if (e.kind == 1) {
						if (needed > pushed || $parentID != 'root') {
							if (
								(!$viewed.has(e.id) || $parentID != 'root') &&
								!arrayContainsEvent(updated, e.id)
							) {
								pushed++;
								updated.push(e);
								//console.log(84, pushed);
								dirty = true;
							}
						}
					}
				}
			}
			if (dirty) {
				stableShortList.update((c) => {
					c = updated;
					return c;
				});
				//console.log(90);
			}
			return $stableShortList.length;
		}
	);

	function arrayContainsEvent(a: NostrEvent[], id: string): boolean {
		let inSet = new Set<string>();
		for (let e of a) {
			inSet.add(e.id);
		}
		return inSet.has(id);
	}

	let eventID: string;

	onMount(() => {
		const handleResize = () => {
			if (window.visualViewport) {
				document.body.style.height = `${window.visualViewport.height}px`;
			}
		};

		window.visualViewport?.addEventListener('resize', handleResize);

		handleResize();

		return () => {
			window.visualViewport?.removeEventListener('resize', handleResize);
		};
	});

	$: tags = () => {
		const tags: NDKTag[] = [];
		if ($threadParentID !== 'root') {
			const path = $threadParentIDChain;
			if (path.length >= 2) {
				tags.push(['p', $FrontendDataStore.events.get($threadParentID)?.pubkey!]);
				tags.push(['e', path[1], '', 'root']);
				if (path.length === 2) {
					tags.push(['e', path[1], '', 'reply']);
				} else {
					tags.push(['e', path[path.length - 1], '', 'reply']);
					if (path.length > 3) {
						for (let i = 2; i < path.length - 1; i++) {
							tags.push(['e', path[i], '', 'mention']);
						}
					}
				}
			}
		}
		return tags;
	};
</script>

<div class=" hidden">{$shortListLength}</div>
<ChatLayout hideFaucet={$threadParentID != 'root'}>
	<div slot="buttons">
		{#if $threadParentID != 'root'}
			<div class=""><Button onClick={pop}><ArrowTurnUpSolid /></Button></div>
		{/if}
	</div>
	<slot>
		{#if $stableShortList.length > 0 || $threadParentID != 'root'}
			{#if $threadParentID != 'root'}
				<RenderKind1AsThreadHead note={$FrontendDataStore.events.get($threadParentID)} />
			{/if}
			{#each $stableShortList as event, i (event.id)}
				<RenderKind1
					isTop={event.id == $stableShortList[0].id && $threadParentID == 'root'}
					store={FrontendDataStore}
					note={event}
					onClickReply={() => {
						if ($threadParentID == 'root') {
							viewed.update((v) => {
								v.add(event.id);
								return v;
							});
						}
						threadParentIDChain.update((exising) => {
							exising.push(event.id);
							return exising;
						});
					}}
				/>
			{/each}
		{:else}
			<Coracle />
		{/if}
	</slot>
	<div slot="input" class="w-full content-end">
		<MessageInput horsenote bind:content={messageInputContent} tags={tags()} />
	</div>
	<div slot="right">
		<div class=" ml-2">
			<h3>HUMBLE HORSE</h3>
			<h6>Release Name: "Giddy Up"</h6>
			<div class="mt-4"></div>
			Events in memory: {$FrontendDataStore.events.size}<br />
			<Button
				onClick={() => {
					console.log($threadParentID, $FrontendDataStore.replies.get($threadParentID));
				}}>Print root event data</Button
			><br />
			<Button
				onClick={() => {
					console.log($FrontendDataStore);
				}}>Print FrontendDataStore</Button
			>
			<p>LOGGED IN AS: {$currentUser?.pubkey}</p>
			<h3 class=" mt-4">Bloom Filter Metrics</h3>

			Bits/Elem: {$FrontendDataStore.ourBloom?.buckets.BYTES_PER_ELEMENT * 8}<br />
			Array Length (bits): {$FrontendDataStore.ourBloom?.buckets.byteLength * 8}<br />
			<Input placeholder="event ID" class="mt-6 w-96" bind:value={eventID} /><Button
				onClick={() => {
					let testbloom = new BloomFilter(JSON.parse($FrontendDataStore._bloomString), 32);
					for (let e of $stableShortList) {
						console.log(testbloom.test(e.id));
					}
					console.log(216, testbloom.test(eventID));
				}}
				>Query bloom filter
			</Button><br />
			<Button
				onClick={() => {
					let bloomString = $FrontendDataStore._bloomString;
					if (bloomString) {
						let bloom = new BloomFilter(JSON.parse(bloomString), 32);
						for (let v of $viewed) {
							bloom.add(v);
						}
						if (!bloom) {
							throw new Error('invalid bloom filter');
						}
						if (!$currentUser) {
							throw new Error('invalid user');
						}
						let e = new NDKEvent($ndk);
						e.kind = 18100;
						e.created_at = Math.floor(new Date().getTime() / 1000);
						e.content = 'Bloom filter test';
						e.tags.push(['bloom', '32', JSON.stringify([].slice.call(bloom.buckets))]);
						e.author = $currentUser;
						e.publish().then((r) => {
							console.log(r);
							console.log(e);
						});
					}
				}}>Publish bloom filter</Button
			><br />
			<Button
				onClick={() => {
					let _ndk = new NDKSvelte({
						explicitRelayUrls: ['ws://127.0.0.1:6969']
					});
					console.log(270);
					_ndk.connect().then(() => {
						console.log(271);
						$FrontendDataStore.events.forEach((e) => {
							let en = new NDKEvent(_ndk, e);
							en.publish();
						});
					});
				}}>Publish all events to local relay</Button
			>
			<br />
			<h3>Your Keyword Ranks</h3>
			<div class="max-h-48 overflow-y-scroll">
				{#each [...$FrontendDataStore.keywords].sort(([sa, a], [sb, b]) => {
					return b - a;
				}) as [word, count]}{word}: {count} <br />{/each}
			</div>
			<div>
				<br />
				<h3>TODO</h3>
				<ul>
					<li>Simple lndhub & cashu interface</li>
					<li>Nostrocket problem tracker</li>
					<li>Help thread</li>
					<li>DVM requests</li>
					<li>Latest stuff from highlighter</li>
					<li>Tiks (highlights of podcasts/videos using ffmpeg segmented blossom server)</li>
					<li></li>
				</ul>
			</div>
		</div>
	</div>
</ChatLayout>
