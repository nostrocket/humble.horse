<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { currentPubkey } from '@/stores/user';
import { responseFromWorker } from '@/workers/firehose_master';


</script>
<Button on:click={()=>{console.log($responseFromWorker)}}>Print responseFromWorker to console</Button><br />
Local Pubkey: {$currentPubkey}
{#if responseFromWorker && $responseFromWorker}
Master pubkey for WoT: {$responseFromWorker.masterPubkey} <br />
Root events: {$responseFromWorker.rootEvents.size} <br />
Total events: {$responseFromWorker.events.size}
{/if}
