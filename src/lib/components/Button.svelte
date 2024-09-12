<script lang="ts">
	export let onClick: () => void;
	export let notifs = 0;
	export let disabled: boolean = false;
</script>

<button
	on:click={onClick}
	class="relative inline-flex items-center rounded-lg p-2.5 text-center text-sm font-medium text-slate-800 dark:text-slate-200"
	{disabled}
>
	<slot />
	{#if notifs > 0}
		<div
			class="absolute -end-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-sm bg-orange-500 text-xs font-bold text-white"
		>
			{notifs}
		</div>
	{/if}
</button>
