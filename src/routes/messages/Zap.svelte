<script lang="ts">
	import type { EventTreeItem } from '@/workers/firehose.types';
	import { BoltSolid } from 'svelte-awesome-icons';
	export let tree: EventTreeItem;
	export let onclick: () => {};
</script>

<button
	on:click={onclick}
	type="button"
	class="relative inline-flex items-center p-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-cyan-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
>
	<BoltSolid />
	<span class="sr-only">Notifications</span>

</button>
