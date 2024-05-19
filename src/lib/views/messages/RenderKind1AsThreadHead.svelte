<script lang="ts">
	import RenderNoteContent from '@/components/RenderNoteContent.svelte';
	import UserDisplayName from '@/components/UserDisplayName.svelte';
	import UserProfilePic from '@/components/UserProfilePic.svelte';
	import { viewed } from '@/snort_workers/main';
	import type { FrontendData } from '@/snort_workers/types';
	import type { NostrEvent } from 'nostr-tools';
	import { type Writable } from 'svelte/store';

	export let note: NostrEvent;
	//export let store: Writable<FrontendData>;

	let top: HTMLDivElement;

	//$: childrenCount = $store?.replies.get(note.id) ? $store.replies.get(note.id)!.size : 0;
	function formatTimeAgo(timestamp: number): string {
    const currentTime = Date.now();
    const secondsAgo = Math.floor((currentTime - timestamp) / 1000);

    if (secondsAgo < 60) {
      return `${secondsAgo} seconds ago`;
    } else if (secondsAgo < 3600) {
      const minutesAgo = Math.floor(secondsAgo / 60);
      return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
    } else if (secondsAgo < 86400) {
      const hoursAgo = Math.floor(secondsAgo / 3600);
      return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
    } else if (secondsAgo < 604800) {
      const daysAgo = Math.floor(secondsAgo / 86400);
      return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
    } else {
      const formattedDate = new Date(timestamp).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return formattedDate;
    }
  }	



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
								{formatTimeAgo(note.created_at * 1000)}

							{#if $viewed.has(note.id)}✓{/if}
						</h6>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
