<script lang="ts">
	import RenderNoteContent from '@/components/RenderNoteContent.svelte';
	import Marcus from './Marcus.svelte';
	import type { NostrEvent } from 'nostr-tools';
	import Zap from './Zap.svelte';
	import Reply from './Reply.svelte';
	import { derived, type Writable } from 'svelte/store';
	import type { FrontendData } from '@/snort_workers/types';
	import { inview } from 'svelte-inview';
	import { onMount } from 'svelte';
	import { viewed } from '@/snort_workers/main';

	export let note: NostrEvent;
	export let onClickReply: () => void;
	export let store: Writable<FrontendData>;

	export let isTop: boolean = false;

    let top: HTMLDivElement;

onMount(() => {
    if (isTop) {
        (async () => {
        top.scrollIntoView()
    })();
    }
});

	$: childrenCount = $store?.replies.get(note.id) ? $store.replies.get(note.id)!.size : 0;
</script>

<div bind:this={top} class="w-full pt-2 pl-2 pr-2">
	<div class="grid">
		<div class="flex gap-2">
			<img
				class="w-8 h-8 rounded-full"
				src="https://zenquotes.io/img/marcus-aurelius.jpg"
				alt="profile pic"
			/>
			<div class="grid">
				<h5 class="text-gray-900 dark:text-orange-600 font-semibold leading-snug pb-1">Marcus</h5>
				<div class="grid overflow-hidden mr-2 min-w-56">
					<div
						class="px-3.5 py-2 bg-gray-200 dark:bg-gray-700 rounded-e-xl rounded-es-xl flex flex-col gap-2"
					>
						<h5 class="text-sm font-normal text-gray-900 dark:text-white py-2">
							<RenderNoteContent inputString={note.content} />
						</h5>
						<div class="flex justify-between">
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
								{new Date(note.created_at * 1000).toLocaleString()}
								{#if $viewed.has(note.id)}✓{/if}
							</h6>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<div
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
