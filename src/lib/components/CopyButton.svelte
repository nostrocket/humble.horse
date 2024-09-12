<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Check, Copy } from 'lucide-svelte';

	export let text;
	let copyed: boolean;
</script>

<Button
	on:click={() => {
		if (text && navigator.clipboard) {
			navigator.clipboard.writeText(text);
			copyed = true;
			setTimeout(() => {
				copyed = false;
			}, 2000);
		}
	}}
>
	{#if copyed}
		<Check class="h-5 w-5" />
	{:else}
		<Copy class="h-5 w-5" />
	{/if}
</Button>
