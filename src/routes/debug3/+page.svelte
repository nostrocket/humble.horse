<script lang="ts">
	import ChatLayout from '@/components/ChatLayout.svelte';
	import { FrontendDataStore, Init } from '@/snort_workers/main';
	import { onMount } from 'svelte';

	onMount(()=>{
		Init()
	})
</script>

<ChatLayout>
	<slot>
		{#if FrontendDataStore && $FrontendDataStore}
		<button on:click={()=>{console.log($FrontendDataStore)}}>print</button>
		Base Pubkey: {$FrontendDataStore.basePubkey} <br />
		EVENTS:
		<hr />
		<ul>
		{#each $FrontendDataStore.roots as event}<li class=" m-4">{event.content} <br />REPLIES: {$FrontendDataStore.replies.get(event.id)?.size}</li>{/each}
	</ul>
		{/if}
	</slot>
</ChatLayout>
