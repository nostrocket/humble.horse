<script lang="ts">
	import RenderNoteContent from '@/components/RenderNoteContent.svelte';
	import UserDisplayName from '@/components/UserDisplayName.svelte';
	import UserProfilePic from '@/components/UserProfilePic.svelte';
	import { viewed } from '@/snort_workers/main';
	import type { FrontendData } from '@/snort_workers/types';
	import type { NostrEvent } from 'nostr-tools';
	import { type Writable } from 'svelte/store';

	export let note: NostrEvent;
	export let store: Writable<FrontendData>;

	let top: HTMLDivElement;

	$: childrenCount = $store?.replies.get(note.id) ? $store.replies.get(note.id)!.size : 0;
</script>

<div class="w-full pt-2 pl-2 pr-2">
	<div class="grid">
		<div class="flex gap-2">
			<UserProfilePic pubkey={note.pubkey} />
			<div class="grid">
				<h5 class="text-gray-900 dark:text-orange-600 font-semibold leading-snug pb-1"><UserDisplayName pubkey={note.pubkey} /></h5>
				<div class="grid overflow-hidden mr-2 min-w-56">
					<div
						class="px-3.5 py-2 bg-fuchsia-300 dark:bg-fuchsia-950 rounded-e-xl rounded-es-xl flex flex-col gap-2"
					>
						<h5 class="text-sm font-normal text-gray-900 dark:text-white py-2">
							<RenderNoteContent inputString={note.content} />
						</h5>
					</div>
					<div bind:this={top} class="justify-end items-center inline-flex">
						<h6 class="text-gray-500 text-xs font-normal leading-4 py-1">
							{new Date(note.created_at * 1000).toLocaleString()}{#if $viewed.has(note.id)}✓{/if}
						</h6>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
