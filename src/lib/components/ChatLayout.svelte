<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { toggleMode } from 'mode-watcher';
	import { Moon, Sun } from 'radix-icons-svelte';
	import {
		ChartPieSolid,
		CircleQuestionSolid,
		CodePullRequestSolid,
		FaucetSolid,
		GearSolid,
		GhostSolid,
		ListCheckSolid,
		PodcastSolid,
		AngleLeftSolid,
		AngleRightSolid
	} from 'svelte-awesome-icons';
	import Button from './Button.svelte';
	import Login from '@/ndk/Login.svelte';

	export let hideFaucet = false;

	$: isExpanded = false;

	const descriptions = {
		faucet: 'Home',
		todo: 'To-Do List',
		help: 'Help',
		gear: 'Settings',
		merits: 'Merits',
		github: 'GitHub',
		theme: 'Toggle Theme',
		tiks: 'Podcast',
		marcus: 'Marcus',
		ghost: 'Ghost Mode'
	};

	$: getContainerClass = (menuItem: string) => {
		if ($page.url.pathname.startsWith(`/${menuItem}`)) {
			return 'flex w-full items-center bg-orange-300 transition-all';
		} else {
			return 'flex w-full items-center transition-all';
		}
	};

	$: getIconClass = (menuItem: string) => {
		if ($page.url.pathname.startsWith(`/${menuItem}`)) {
			return 'text-cyan-700 transition-all';
		} else {
			return 'transition-all';
		}
	};
</script>

<div class="flex h-full flex-row">
	<!-- Icon Sidebar -->
	<div
		class={`block flex-shrink-0 bg-orange-500 transition-all duration-300 dark:bg-cyan-950 ${isExpanded ? 'w-40' : 'w-12'}`}
	>
		<div class="bg-layer-2 relative flex h-full flex-col">
			<div
				class="no-scrollbar flex flex-1 flex-col overflow-x-hidden overflow-y-scroll sm:overflow-hidden"
			>
				<slot name="buttons" />
				{#if !hideFaucet}
					<div class="flex w-full items-center">
						<Button
							onClick={() => {
								goto(`${base}/`);
							}}
						>
							<FaucetSolid />
						</Button>
						{#if isExpanded}
							<span class="ml-2 text-sm text-white">{descriptions.faucet}</span>
						{/if}
					</div>
				{/if}

				<div class={getContainerClass('todo')}>
					<Button
						onClick={() => {
							goto(`${base}/todo`);
						}}
					>
						<ListCheckSolid class={getIconClass('todo')} />
					</Button>
					{#if isExpanded}
						<span class="ml-2 text-sm text-white">{descriptions.todo}</span>
					{/if}
				</div>

				<div class={getContainerClass('help')}>
					<Button
						onClick={() => {
							goto(`${base}/help`);
						}}
					>
						<CircleQuestionSolid class={getIconClass('help')} />
					</Button>
					{#if isExpanded}
						<span class="ml-2 text-sm text-white">{descriptions.help}</span>
					{/if}
				</div>

				<div class={getContainerClass('gear')}>
					<Button onClick={() => {}}>
						<GearSolid class={getIconClass('gear')} />
					</Button>
					{#if isExpanded}
						<span class="ml-2 text-sm text-white">{descriptions.gear}</span>
					{/if}
				</div>

				<div class={getContainerClass('merits')}>
					<Button
						onClick={() => {
							goto(`${base}/merits`);
						}}
					>
						<ChartPieSolid class={getIconClass('merits')} />
					</Button>
					{#if isExpanded}
						<span class="ml-2 text-sm text-white">{descriptions.merits}</span>
					{/if}
				</div>

				<div class={getContainerClass('github')}>
					<Button
						onClick={() => {
							window.location.href = `https://github.com/nostrocket/humble.horse/`;
						}}
					>
						<CodePullRequestSolid class={getIconClass('github')} />
					</Button>
					{#if isExpanded}
						<span class="ml-2 text-sm text-white">{descriptions.github}</span>
					{/if}
				</div>

				<div class={getContainerClass('theme')}>
					<Button onClick={toggleMode}>
						<Moon class="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
						<Sun
							class="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
						/>
						<span class="sr-only">Toggle theme</span>
					</Button>
					{#if isExpanded}
						<span class="ml-2 text-sm text-white">{descriptions.theme}</span>
					{/if}
				</div>

				<div class={getContainerClass('tiks')}>
					<Button
						onClick={() => {
							goto(`${base}/tiks`);
						}}
					>
						<PodcastSolid class={getIconClass('tiks')} />
					</Button>
					{#if isExpanded}
						<span class="ml-2 text-sm text-white">{descriptions.tiks}</span>
					{/if}
				</div>

				<div class={getContainerClass('marcus')}>
					<Button
						notifs={0}
						onClick={() => {
							goto(`${base}/marcus`);
						}}
					>
						<img
							src={`${base}/marcus.png`}
							alt="Marcus"
							class={`w-9 min-w-9 ${getIconClass('marcus')}`}
						/>
					</Button>
					{#if isExpanded}
						<span class="ml-2 text-sm text-white">{descriptions.marcus}</span>
					{/if}
				</div>
			</div>
			<div class="mb-2 overflow-hidden">
				<Button onClick={() => (isExpanded = !isExpanded)}>
					{#if isExpanded}
						<AngleLeftSolid />
					{:else}
						<AngleRightSolid />
					{/if}
				</Button>
				<div class="flex w-full items-center">
					<Button
						onClick={() => {
							alert('ghost mode: implement me!');
						}}
					>
						<GhostSolid />
					</Button>
					{#if isExpanded}
						<span class="ml-2 text-sm text-white">{descriptions.ghost}</span>
					{/if}
				</div>
				<Login />
			</div>
		</div>
	</div>

	<div class="flex-1">
		<div class="flex h-full flex-col">
			<!-- CONTENT-->
			<div
				id="content"
				class="no-scrollbar relative z-10 h-full overflow-x-hidden overflow-y-scroll bg-white dark:bg-slate-900"
			>
				<slot />
				<!-- NOTE VIEWER-->
			</div>
			<!-- INPUT BOX-->
			<div class="relative h-fit w-full">
				<div class="z-20 flex"><slot name="input" /></div>
			</div>
		</div>
	</div>
	<div class="hidden flex-1 lg:block">
		<div class="h-full flex-col">
			<div class="h-full flex-1 overflow-y-scroll bg-slate-100 dark:bg-cyan-800">
				<slot name="right" />
			</div>
		</div>
	</div>
</div>
