<script lang="ts">
	import RenderNoteContent from '@/components/RenderNoteContent.svelte';
	import UserDisplayName from '@/components/UserDisplayName.svelte';
	import UserProfilePic from '@/components/UserProfilePic.svelte';
	import { viewed } from '@/snort_workers/main';
	import type { FrontendData } from '@/snort_workers/types';
	import { formatTimeAgo } from '@/utils';
	import type { NostrEvent } from 'nostr-tools';
	import { onMount } from 'svelte';
	import { inview } from 'svelte-inview';
	import { type Readable } from 'svelte/store';
	import Marcus from './Marcus.svelte';
	import Reply from './Reply.svelte';
	import Zap from './Zap.svelte';
	import { threadParentID } from '@/stores/shortlist';

	export let note: NostrEvent;
	export let onClickReply = () => {};
	export let store: Readable<FrontendData>;

	export let isTop: boolean = false;

	let top: HTMLDivElement;
	let messageViewController: HTMLDivElement;
	let hiddenMessageNotice: HTMLSpanElement;

	onMount(() => {
		if (isTop) {
			(async () => {
				top.scrollIntoView({ behavior: 'smooth' });
			})();
		}
	});

	function handleMessageInviewLeave(event) {
		if (event.detail.scrollDirection.vertical == 'up' && $threadParentID == 'root') {
			top.style.transition = 'transform 400ms';
			top.style.transform = 'translateX(-1200px)';
			hiddenMessageNotice.style.display = 'block';

			setTimeout(() => {
				messageViewController.scrollIntoView({ behavior: 'smooth' });
			}, 1500);
		}
	}

	$: childrenCount = $store?.replies.get(note.id) ? $store.replies.get(note.id)!.size : 0;
</script>

<span
	bind:this={hiddenMessageNotice}
	class="hidden text-white/50 text-xs mx-auto text-center h-0 absolute top-4 left-0 right-0"
	>Previous messages are hidden from view. Refresh the page to view it again.</span
>
<div bind:this={top} class="w-full pt-2 pl-2 pr-2">
	<div class="grid">
		<div class="flex gap-2">
			<UserProfilePic pubkey={note.pubkey} />
			<!-- <img
				class="w-8 h-8 rounded-full"
				src="https://zenquotes.io/img/marcus-aurelius.jpg"
				alt="profile pic"
			/> -->
			<div class="grid">
				<h5 class="text-gray-900 dark:text-orange-600 font-semibold leading-snug pb-1">
					<UserDisplayName pubkey={note.pubkey} />
				</h5>
				<div class="grid overflow-hidden mr-2 min-w-56">
					<div
						class="px-3.5 py-2 bg-gray-200 dark:bg-gray-700 rounded-e-xl rounded-es-xl flex flex-col gap-2"
					>
						<h5 class="text-sm font-normal text-gray-900 dark:text-white py-2">
							<RenderNoteContent inputString={note.content} />
						</h5>
						<div id="buttons" class="relative flex justify-between">
							<div
								id="message-view-controller"
								class="absolute h-0 top-3"
								use:inview={{}}
								on:inview_leave={(event) => {
									handleMessageInviewLeave(event);
								}}
							/>
							<div>
								<Marcus
									onclick={() => {
										alert('implement me!');
									}}
									{note}
								/>
							</div>

							<div>
								<Zap
									onclick={() => {
										alert('implement me!');
									}}
									{note}
								/>
								<Reply onclick={onClickReply} {childrenCount} />
							</div>
						</div>
					</div>
					<div class="flex justify-between">
						<h6 class="text-gray-500 text-xs font-normal leading-4 py-1"></h6>
						<div class="justify-end items-center inline-flex">
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
</div>
<!-- SCROLL OUT OF VIEW todo: change the location of this (in the DOM) so that we can use an animation to make it clear that the note has been "viewed" and can't be seen again -->
<div
	bind:this={messageViewController}
	id="view-controller"
	use:inview={{}}
	on:inview_leave={(event) => {
		if (event.detail.scrollDirection.vertical == 'up') {
			viewed.update((v) => {
				v.add(note.id);
				return v;
			});
		}
	}}
/>
