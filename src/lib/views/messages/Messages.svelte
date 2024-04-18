<script lang="ts">
	import ChatLayout from '@/components/ChatLayout.svelte';
	import Coracle from '@/components/Coracle.svelte';
	import { Button } from '@/components/ui/button';
	import { FrontendDataStore } from '@/snort_workers/main';
	import { viewed } from '@/workers_snort/firehose_master';
	import type { NostrEvent } from 'nostr-tools';
	import { ArrowTurnUpSolid } from 'svelte-awesome-icons';
	import { derived, writable, type Writable } from 'svelte/store';
	import RenderKind1 from './RenderKind1.svelte';
	import RenderKind1AsThreadHead from './RenderKind1AsThreadHead.svelte';

	//take current threadparentID (or root) and create a derived store of all events. derive antoher one to pipe it through sorting/filtering store.
	//
	//export let FrontendDataStore: Writable<FrontendData>

	let threadParentIDChain = writable(['root']);

	function pop() {
		threadParentIDChain.update((existing) => {
			existing.pop();
			return existing;
		});
	}

	let threadParentID = derived(threadParentIDChain, ($tpi) => {
		return $tpi[$tpi.length - 1];
	});

	let renderQueue = derived([FrontendDataStore, threadParentID], ([$fds, $parentID]) => {
		if ($parentID == 'root') {
			return $fds.roots;
		} else {
			let workerSet = $fds.replies.get($parentID);
			let fullSet = new Map<string, NostrEvent>();
			if (workerSet) {
				for (let id of workerSet) {
					let ev = $fds.rawEvents.get(id);
					if (ev) {
						fullSet.set(id, ev);
					}
				}
			}
			//todo: add live subscriptions
			return Array.from(fullSet, ([id, ev]) => ev).toSorted((a, b) => {
				return a.created_at - b.created_at;
			});
		}
	});

	let _stableShortlist: NostrEvent[] = [];
	let stableShortList: Writable<NostrEvent[]> = writable(_stableShortlist);

	threadParentID.subscribe(() => {
		_stableShortlist = [];
		stableShortList.set(_stableShortlist);
	});

	renderQueue.subscribe((q) => {});

	//remove viewed and add new items that haven't been viewed
	let shortListLength = derived(
		[renderQueue, viewed, threadParentID],
		([$renderQ, $viewed, $parentID]) => {
			let dirty = false;
			let updated: NostrEvent[] = [];
			for (let e of _stableShortlist) {
				if (!$viewed.has(e.id) || $parentID != 'root') {
					//console.log(72, e.id);
					updated.push(e);
				} else {
					dirty = true;
				}
			}
			let needed = 6 - updated.length;
			if (needed > 0) {
				let pushed = 0;
				for (let e of $renderQ) {
					if (needed > pushed) {
						if (!$viewed.has(e.id) && !arrayContainsEvent(updated, e.id)) {
							pushed++;
							updated.push(e);
							//console.log(84, pushed);
							dirty = true;
						}
					}
				}
			}
			if (dirty) {
				_stableShortlist = updated;
				stableShortList.update((c) => {
					c = updated;
					return c;
				});
				//console.log(90);
			}
			return _stableShortlist.length;
		}
	);

	function arrayContainsEvent(a: NostrEvent[], id: string): boolean {
		let inSet = new Set<string>();
		for (let e of a) {
			inSet.add(e.id);
		}
		return inSet.has(id);
	}
</script>

<div class=" hidden">{$shortListLength}</div>
<ChatLayout>
	<div slot="buttons">
		{#if $threadParentID != 'root'}
			<Button on:click={pop} variant="outline" size="icon" class="-scale-x-100 hover:skew-y-12"
				><ArrowTurnUpSolid /></Button
			>
		{/if}
	</div>
	<slot>
		{#if $stableShortList.length > 0 || $threadParentID != 'root'}
			{#if $threadParentID != 'root'}
				<RenderKind1AsThreadHead
					store={FrontendDataStore}
					note={$FrontendDataStore.rawEvents.get($threadParentID)}
				/>
			{/if}
				{#each $stableShortList as event, i (event.id)}<RenderKind1 isTop={(event.id == $stableShortList[0].id) && $threadParentID == "root"}
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
</ChatLayout>
