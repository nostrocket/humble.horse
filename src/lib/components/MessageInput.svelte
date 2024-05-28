<script lang="ts">
	import { GhostSolid } from 'svelte-awesome-icons';
	import Button from './Button.svelte';
	import { currentUser, ndk } from '@/ndk/ndk';
	import { NDKEvent, type NDKTag } from '@nostr-dev-kit/ndk';
	import { Textarea } from './ui/textarea';

	export let selected = true;
	export let content = '';
	export let tags: NDKTag[] = [];
	export let horsenote = false;

	function publish(c: string) {
		if (c.length < 1) {alert("invalid note length")}
		console.log(15, c)
		if (!$currentUser) {
			alert('could not find your event signer');
			throw new Error('invalid user');
		} else {
			let e = new NDKEvent($ndk);
			e.kind = 1;
			e.created_at = Math.floor(new Date().getTime() / 1000);
			e.content = c + (horsenote ? '\nPublished with humble.horse 🐎🐎🐎' : '');
			e.tags = tags;
			e.author = $currentUser;
			console.log(e)
			e.publish().then((r) => {
				console.log(r);
				console.log(e);
			});
		}
	}
</script>

<div class="flex items-center h-16 focus-within:h-36 w-full px-3 py-2 bg-zinc-300 dark:bg-cyan-900">
	<div class="">
		<button
			type="button"
			class="inline-flex justify-center p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
		>
			<svg
				class="w-5 h-5"
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
			class="p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
		>
			<svg
				class="w-5 h-5"
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
		class="resize-none block mx-4 p-2.5 w-full h-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
		placeholder="Start typing..."
		bind:value={content}
	></Textarea>
	<div class="flex flex-col">
		<Button
			onClick={() => {
				alert('ghost mode: implement me!');
			}}><GhostSolid /></Button
		>
		<Button
			onClick={() => {
				//console.log(content)
				publish(content);
			}}
		>
			<svg
				class="w-5 h-5 rotate-90 rtl:-rotate-90"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="currentColor"
				viewBox="0 0 18 20"
			>
				<path
					d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z"
				/>
			</svg>
			<span class="sr-only">Send message</span>
		</Button>
	</div>
</div>
