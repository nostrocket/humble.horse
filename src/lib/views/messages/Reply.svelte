<script lang="ts">
	import { CommentSolid, ReplySolid } from 'svelte-awesome-icons';
	export let onclick: () => void;
	export let childrenCount: number;
</script>

<button
	on:click={onclick}
	type="button"
	class="relative inline-flex items-center p-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-cyan-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
>
	<CommentSolid />
	<span class="sr-only">Notifications</span>
	<div
		class="absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-orange-500 border-2 border-white rounded-full -top-2 -end-2 dark:border-yellow-200"
	>
		{childrenCount}
	</div>
</button>
