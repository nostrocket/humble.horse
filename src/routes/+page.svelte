<script lang="ts">
	import Kind1 from '@/components/Kind1.svelte';
	import { EventTreeItem, type RecursiveEventMap } from '@/workers/firehose.types';
	import { responseFromWorker } from '@/workers/firehose_master';
	import { onDestroy, onMount } from 'svelte';
	import { derived, writable, type Writable } from 'svelte/store';
	onMount(() => {});
	onDestroy(() => {});

	function find(m: RecursiveEventMap, id: string): EventTreeItem | undefined {
		if (m.get(id)) {
			return m.get(id)!;
		}
		for (let [_, item] of m) {
			let c = find(item.children, id);
			if (c) {
				return c;
			}
		}
	}

	let parentFromUsersHistory = writable([""])

	//todo: if the last parentFromUsersHistory is included in the current threadParent's tags, go to that when user navigates UP. If not, go to the e-tag that 1) we have and 2) has the most replies.

	let threadParentID = writable(["root"]);

	let rThreadParent = derived([responseFromWorker, threadParentID], ([$rfw, $parentID]) => {
		if ($parentID[$parentID.length-1] == 'root') {
			return $rfw.recursiveEvents;
		} else {
			return find($rfw.recursiveEvents.children, $parentID[$parentID.length-1]);
		}
	});
</script>

{#if $rThreadParent}
	{$rThreadParent.children.size} <br />
	<Kind1
		treeItem={$rThreadParent || $responseFromWorker.recursiveEvents}
		bind:newParent={threadParentID}
	/>
{/if}
