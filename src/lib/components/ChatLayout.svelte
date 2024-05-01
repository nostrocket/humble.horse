<script>
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { toggleMode } from 'mode-watcher';
	import { Home, Moon, Sun } from 'radix-icons-svelte';
	import {
		CircleQuestionSolid,
		FaucetSolid,
		GearSolid,
		GhostSolid,
		ListCheckSolid,
		PodcastSolid
	} from 'svelte-awesome-icons';
	import Button from './Button.svelte';
	import LoginButton from './LoginButton.svelte';
	import Login from '@/ndk/Login.svelte';

	export let hideFaucet = false;
</script>

<div class="flex h-screen w-screen flex-row">
	<!-- Icon Sidebar -->
	<div class="w-12 flex-shrink-0 block bg-orange-500 dark:bg-cyan-950">
		<div class="flex h-full flex-col bg-layer-2">
			<div class="flex flex-1 flex-col overflow-hidden place-items-center">
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
					notifs={0}
					onClick={() => {
						goto(`${base}/marcus`);
					}}><img class="w-9 min-w-9" src={`${base}/marcus.png`} /></Button
				>
			</div>
			<div class="mb-2 overflow-hidden place-items-center">
				<Button onClick={()=>{alert("ghost mode: implement me!")}}><GhostSolid /></Button>
				<Login />
			</div>
		</div>
	</div>

	<div class="flex-1">
		<div class="h-full flex-col">
			<div class="h-5/6 bg-white dark:bg-slate-900 overflow-x-hidden overflow-y-scroll no-scrollbar"><slot /></div>
			<div class="h-1/6 contain-content pb-0"><slot name="input" /></div>
		</div>
	</div>
	<div class="hidden flex-1 lg:block">
		<div class="h-full flex-col">
			<div class="h-full flex-1 bg-slate-100 dark:bg-cyan-800 overflow-y-scroll"><slot name="right" /></div>
		</div>
	</div>
</div>
