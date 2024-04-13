<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import LoginButton from '@/components/LoginButton.svelte';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Init } from '@/workers/firehose_master';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import { Home, QuestionMark } from 'radix-icons-svelte';
	import { onMount } from 'svelte';
	import { ArrowTurnUpSolid } from 'svelte-awesome-icons';
	import Moon from 'svelte-radix/Moon.svelte';
	import Sun from 'svelte-radix/Sun.svelte';
	import '../app.css';

	onMount(() => {
		Init();
	});
</script>
<ModeWatcher />

<div
	class="grid grid-cols-12 grid-rows-12 w-full h-full dark:bg-gradient-to-r from-transparent to-blue-950"
>
	<div class="grid grid-cols-12 grid-rows-12 col-span-12 row-span-10">
		<div
			class="flex flex-col gap-2 py-2 bg-slate-400 dark:bg-zinc-800 row-span-12 col-span-1 place-items-center"
		>
			<Button variant="outline" size="icon" class="-scale-x-100 hover:skew-y-12"
				><ArrowTurnUpSolid /></Button
			>
			<Button on:click={()=>{goto(`${base}/`)}} variant="outline" size="icon" class="-scale-x-100 hover:skew-y-12"
				><Home size={24} /></Button
			>
			<Button variant="outline" size="icon" class="hover:skew-y-12"
				><QuestionMark size={24} /></Button
			>

			<Button on:click={toggleMode} variant="outline" size="icon">
				<Sun
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>

			<LoginButton />

			<Button on:click={()=>{goto(`${base}/debug`)}}>D</Button>

		</div>
		<div
			class="bg-white dark:bg-zinc-900 row-span-12 col-span-11 overflow-x-hidden overflow-y-scroll no-scrollbar"
		>
			<slot />
		</div>
	</div>
	<div class="col-span-12 row-span-10 bg-sky-100 dark:bg-sky-950">
		<Input placeholder="Start typing..." type="text" class=" bg-sky-100 dark:bg-sky-950" />
	</div>
</div>
