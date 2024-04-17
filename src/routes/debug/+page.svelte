<script lang="ts">
	import ChatLayout from '@/components/ChatLayout.svelte';
	import { Button } from '@/components/ui/button';
	import { currentPubkey } from '@/stores/user';
import { responseFromWorker } from '@/workers/firehose_master';


</script>
<ChatLayout>
	<slot>
		<Button on:click={()=>{console.log($responseFromWorker)}}>Print responseFromWorker to console</Button><br />
		Local Pubkey: {$currentPubkey} <br />
		{#if responseFromWorker && $responseFromWorker}
		Master pubkey for WoT: {$responseFromWorker.masterPubkey} <br />
		Root events: {$responseFromWorker.rootEvents.size} <br />
		Total events: {$responseFromWorker.events.size} <br />
		<h3>Event Kinds:</h3>
		{#each $responseFromWorker.kinds as [k, n], i (k)}{k}: {n}<br />{/each}
		<h3>Relays</h3>
		{#each $responseFromWorker.connections as [relay, count]}{relay}: {count}<br />{/each}
		<!-- {#each $responseFromWorker.relays as relay}{relay}<br />{/each} -->
		{/if}
	</slot>
</ChatLayout>

