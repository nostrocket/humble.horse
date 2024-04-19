<script lang="ts">
	import { base } from '$app/paths';
	import type { NostrEvent } from 'nostr-tools';

	export let note: NostrEvent;
	export let onclick: () => void;
</script>

<button
	on:click={onclick}
	type="button"
	class="relative inline-flex items-center p-1 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:outline-none dark:bg-cyan-600 dark:hover:bg-blue-700"
>
	<img class="h-10" src={`${base}/marcus.png`} />
</button>
