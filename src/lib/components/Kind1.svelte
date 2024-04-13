<script lang="ts">
	import type { EventTreeItem } from '@/workers/firehose.types';
	import { ArrowRight } from 'radix-icons-svelte';
	import { type Writable } from 'svelte/store';
	import RenderNoteContent from './RenderNoteContent.svelte';
	export let treeItem: EventTreeItem;
	export let newParent: Writable<string[]>;
        let t: [string, EventTreeItem][]
	$: {
		let _t = [...treeItem.children.entries()]
			.toSorted((_a, _b): number => {
				let [_, a] = _a;
				let [__, b] = _b;
				return b.children.size - a.children.size;
			});
        
        t = _t.filter(([id, item])=>{
            return item.event.kind == 1
        })
	}
</script>

{#each t as [id, tree], i (id)}
	<div class="flex w-full items-start gap-2.5">
		<!-- <Avatar ndk={$ndk} user={e.author} class="rounded-full w-10 h-10 object-cover" /> -->
		<img
			class="w-8 h-8 rounded-full"
			src="https://zenquotes.io/img/marcus-aurelius.jpg"
			alt="profile pic"
		/>
		<div
			class="flex flex-col leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl rounded-es-xl dark:bg-gray-700 my-2 overflow-hidden mr-2"
		>
			<div class="flex items-center space-x-2 rtl:space-x-reverse">
				<span class="text-sm font-semibold text-gray-900 dark:text-white">username</span>
				<span class="text-sm font-normal text-gray-500 dark:text-gray-400"
					>{new Date(tree.event.created_at * 1000).toLocaleString()}</span
				>
			</div>
			<p class="text-sm font-normal py-2.5 text-gray-900 dark:text-white">
				<RenderNoteContent inputString={tree.event.content} />
			</p>
			<a
				class="text-xs text-orange-600"
				href="#"
				on:click={() => {
					console.log(tree);
				}}>print to console</a
			>
			<a
				href="#"
				on:click={() => {
					newParent.update((existing) => {
						existing.push(id);
						return existing;
					});
				}}
				class="text-sm font-normal text-gray-500 dark:text-gray-400 float-right"
				>{tree.children.size}<ArrowRight /></a
			>
		</div>
	</div>
{/each}
