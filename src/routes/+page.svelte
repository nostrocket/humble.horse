<script lang="ts">
	import ChatLayout from '@/components/ChatLayout.svelte';
	import Kind1 from '@/components/Kind1.svelte';
	import { Button } from '@/components/ui/button';
	import { EventTreeItem, type RecursiveEventMap } from '@/workers/firehose.types';
	import { responseFromWorker } from '@/workers/firehose_master';
	import { onDestroy, onMount } from 'svelte';
	import { ArrowTurnUpSolid } from 'svelte-awesome-icons';
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

	//todo: if the last parentFromUsersHistory is included in the current threadParent's tags, go to that when user navigates UP. If not, go to the e-tag that 1) we have and 2) has the most replies.

	let threadParentID = writable(["root"]);

	function pop() {
		threadParentID.update(existing=>{
			existing.pop()
			return existing
		})
	}

	let rThreadParent = derived([responseFromWorker, threadParentID], ([$rfw, $threadParentID]) => {
		if ($threadParentID[$threadParentID.length-1] == 'root') {
			return $rfw.recursiveEvents;
		} else {
			return find($rfw.recursiveEvents.children, $threadParentID[$threadParentID.length-1]);
		}
	});
</script>

<ChatLayout>
	<div slot="buttons">
		{#if $threadParentID[$threadParentID.length-1] != "root"}
		<Button on:click={pop} variant="outline" size="icon" class="-scale-x-100 hover:skew-y-12"
		><ArrowTurnUpSolid /></Button
	>
	{/if}
	</div>
	<slot>

{#if $rThreadParent}
{$rThreadParent.children.size} <br />
<Kind1
	treeItem={$rThreadParent || $responseFromWorker.recursiveEvents}
	bind:newParent={threadParentID}
/>
{/if}
	</slot>
</ChatLayout>

