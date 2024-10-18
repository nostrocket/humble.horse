<script lang="ts">
	import RenderNoteContent from '@/components/RenderNoteContent.svelte';
	import UserDisplayName from '@/components/UserDisplayName.svelte';
	import UserProfilePic from '@/components/UserProfilePic.svelte';
	import UserLud16 from '@/components/UserLud16.svelte';
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

	// Declare showLud16 to toggle visibility of UserLud16
	let showLud16 = false;

	function updateDistance() {
		const rect = messageViewController.getBoundingClientRect();
		if (isTop && rect.top < 120 && $threadParentID === 'root') {
			const marginLeft = Math.max(-240, (rect.top - 120) * 2);
			top.style.marginLeft = `${marginLeft}px`;
		} else {
			top.style.marginLeft = '0px';
		}
	}

	onMount(() => {
		if (isTop) {
			(async () => {
				top.scrollIntoView({ behavior: 'smooth' });
			})();
		}

		const contentDiv = document.getElementById('content');
		if (contentDiv) {
			contentDiv.addEventListener('scroll', updateDistance);
			updateDistance();
		}

		return () => {
			if (contentDiv) {
				contentDiv.removeEventListener('scroll', updateDistance);
			}
		};
	});

	$: childrenCount = $store?.replies.get(note.id) ? $store.replies.get(note.id)!.size : 0;
</script>

<div bind:this={top} class="w-full pt-2 pl-2 pr-2">
	<div class="grid">
		<div class="flex gap-2">
			<UserProfilePic pubkey={note.pubkey} />
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
										showLud16 = !showLud16;  // Toggle visibility of UserLud16 on click
									}}
									{note}
								/>
								<!-- Conditionally display the UserLud16 component based on showLud16 state -->
								{#if showLud16}
									<UserLud16 pubkey={note.pubkey} />
								{/if}
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
></div>
