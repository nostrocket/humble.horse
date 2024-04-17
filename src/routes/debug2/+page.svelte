<script lang="ts">
	import ChatLayout from '@/components/ChatLayout.svelte';
	import { Button } from '@/components/ui/button';
	import { currentPubkey } from '@/stores/user';
	import { responseFromWorker } from '@/workers/firehose_master';
	import { derived } from 'svelte/store';

	let topRoot = derived(responseFromWorker, ($rfw) => {
		return $rfw.events.get($rfw.rootEvents[0]);
	});

	let topRootReplies = derived([responseFromWorker, topRoot], ([$rfw, $tr]) => {
        let eventList = [];
		if ($tr && $tr.id) {
			let list = $rfw.replies.get($tr.id);
			if (list) {
				for (let id of list) {
                    let event = $rfw.events.get(id)
                    if (event) {
                        eventList.push(event)
                    }
				}
			}
		}
        return eventList
	});

    let replyDistribution = derived(responseFromWorker, ($rfw) => {
		let numOfReplies = new Map<number, number>()
        for (let [_, r] of $rfw.replies) {
            let existing = numOfReplies.get(r.length)
            if (!existing) {existing = 0}
            numOfReplies.set(r.length, existing+1)
        }
        return [...numOfReplies].sort(([a, aa],[b, bb])=>{
            return a-b
        })
	});
</script>

<ChatLayout>
	<slot>
		<Button
			on:click={() => {
				console.log($responseFromWorker);
			}}>Print responseFromWorker to console</Button
		><br />
		Local Pubkey: {$currentPubkey} <br />
		{#if responseFromWorker && $responseFromWorker}
			Root events: {$responseFromWorker.rootEvents.length} <br />
			Total events: {$responseFromWorker.events.size} <br />
			<h3>Top event:</h3>
			{$responseFromWorker.events.get($responseFromWorker.rootEvents[0])?.content}
            <hr />
			{#each $topRootReplies as reply} <p>{reply.content}</p><hr />{/each}
			{$responseFromWorker.replies.get($responseFromWorker.rootEvents[0])?.length}

			<h3>Replies</h3>
            {$responseFromWorker.replies.size}

            <h3>Reply Distribution</h3>
            {#each $replyDistribution as [replies, number], i (replies)}{replies}: {number}<br />{/each}


			<!-- {#each $responseFromWorker.relays as relay}{relay}<br />{/each} -->
		{/if}
	</slot>
</ChatLayout>
