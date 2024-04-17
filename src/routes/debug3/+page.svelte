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
		FOLLOWS:
		<hr />
		<ul>
		{#each $FrontendDataStore.baseFollows as pubkey}<li>{pubkey}</li>{/each}
	</ul>
		{/if}
	</slot>
</ChatLayout>
