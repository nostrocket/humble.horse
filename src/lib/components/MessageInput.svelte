<script lang="ts">
	import { GhostSolid } from 'svelte-awesome-icons';
	import Button from './Button.svelte';
	import { currentUser, ndk } from '@/ndk/ndk';
	import { NDKEvent, type NDKTag } from '@nostr-dev-kit/ndk';
	import { Textarea } from './ui/textarea';
	import { Circle } from 'svelte-loading-spinners';
	import { toast } from 'svelte-sonner';

	export let selected = true;
	export let content = '';
	export let tags: NDKTag[] = [];
	export let horsenote = false;

	let isPublishing = false;

	async function publish(c: string) {
		if (c.length < 1) {
			toast.error('Invalid note length');
			return;
		}
		console.log(15, c);
		if (!$currentUser) {
			toast.error('Could not find your event signer');
			throw new Error('invalid user');
		} else {
			isPublishing = true;
			let e = new NDKEvent($ndk);
			e.kind = 1;
			e.created_at = Math.floor(new Date().getTime() / 1000);
			e.content = c + (horsenote ? '\nPublished with humble.horse 🐎🐎🐎' : '');
			e.tags = tags;
			e.author = $currentUser;
			console.log(e);
			try {
				const r = await e.publish();
				console.log(r);
				console.log(e);
				content = '';
				toast.success('Note published successfully!');
			} catch (error) {
				console.error('Failed to publish note:', error);
				toast.error('Failed to publish note. Please try again.');
			} finally {
				isPublishing = false;
			}
		}
	}
</script>

<div class="flex h-16 w-full items-center bg-zinc-300 px-3 py-2 focus-within:h-36 dark:bg-cyan-900">
	<div class="">
		<button
			type="button"
			class="inline-flex cursor-pointer justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
		>
			<svg
				class="h-5 w-5"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 20 18"
			>
				<path
					fill="currentColor"
					d="M13 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM7.565 7.423 4.5 14h11.518l-2.516-3.71L11 13 7.565 7.423Z"
				/>
				<path
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M18 1H2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z"
				/>
				<path
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0ZM7.565 7.423 4.5 14h11.518l-2.516-3.71L11 13 7.565 7.423Z"
				/>
			</svg>
			<span class="sr-only">Upload image</span>
		</button>
		<button
			type="button"
			class="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
		>
			<svg
				class="h-5 w-5"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 20 20"
			>
				<path
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13.408 7.5h.01m-6.876 0h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM4.6 11a5.5 5.5 0 0 0 10.81 0H4.6Z"
				/>
			</svg>
			<span class="sr-only">Add emoji</span>
		</button>
	</div>
	<Textarea
		on:blur={() => {}}
		on:click={() => {
			selected = true;
		}}
		id="chat"
		class="mx-4 block h-full w-full resize-none rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
		placeholder="Start typing..."
		bind:value={content}
	></Textarea>
	<div class="flex flex-col items-center justify-center">
		<Button
			onClick={() => {
				alert('ghost mode: implement me!');
			}}><GhostSolid /></Button
		>
		<Button
			onClick={() => {
				publish(content);
			}}
			disabled={isPublishing}
		>
			{#if isPublishing}
				<Circle size="20" color="#FFFFFF" unit="px" duration="1s" />
			{:else}
				<svg
					class="h-5 w-5 rotate-90 rtl:-rotate-90"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="currentColor"
					viewBox="0 0 18 20"
				>
					<path
						d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z"
					/>
				</svg>
			{/if}
			<span class="sr-only">Send message</span>
		</Button>
	</div>
</div>
