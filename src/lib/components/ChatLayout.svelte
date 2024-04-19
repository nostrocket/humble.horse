<script>
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { toggleMode } from 'mode-watcher';
	import { Home, Moon, QuestionMark, Sun } from 'radix-icons-svelte';
	import LoginButton from './LoginButton.svelte';
	import { Input } from './ui/input';
	import {
		CircleQuestionSolid,
		FaucetSolid,
		GearSolid,
		ListCheckSolid,
		PodcastSolid,
		ToolboxSolid
	} from 'svelte-awesome-icons';
	import Button from './Button.svelte';

	export let hideFaucet = false;
</script>

<div class="grid grid-cols-12 grid-rows-12 w-full h-full">
	<div class="grid grid-cols-12 grid-rows-12 col-span-12 row-span-10">
		<div
			class="flex flex-col gap-y-2 py-2 bg-cyan-500 dark:bg-cyan-950 row-span-12 col-span-1 place-items-center"
		>
			<slot name="buttons" />
			{#if !hideFaucet}
				<Button
					onClick={() => {
						goto(`${base}/`);
					}}
				>
					<FaucetSolid />
				</Button>
			{/if}

			<Button><ListCheckSolid /></Button>
			<Button><CircleQuestionSolid /></Button>
			<Button><GearSolid /></Button>

			<Button onClick={toggleMode}>
				<Moon
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Sun
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>

			<LoginButton />

			<!-- <Button onClick={()=>{goto(`${base}/debug`)}}><ToolboxSolid /></Button
			> -->
			<Button><PodcastSolid /></Button>
			<Button
				onClick={() => {
					goto(`${base}/marcus`);
				}}><img class="w-9 min-w-9" src={`${base}/marcus.png`} /></Button
			>
		</div>
		<div
			class="bg-white dark:bg-zinc-900 row-span-12 col-span-11 overflow-x-hidden overflow-y-scroll no-scrollbar ml-1"
		>
			<slot />
		</div>
	</div>
	<div class="col-span-12 row-span-10 bg-sky-100 dark:bg-sky-950">
		<Input placeholder="Start typing..." type="text" class=" bg-sky-100 dark:bg-sky-950" />
	</div>
</div>
