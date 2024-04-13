<script lang="ts">
	import type { EventTreeItem } from '@/workers/firehose.types';
	import { type Writable } from 'svelte/store';
	import RenderNoteContent from '../../lib/components/RenderNoteContent.svelte';
	import Reply from './Reply.svelte';
	import Zap from './Zap.svelte';
	import Marcus from './Marcus.svelte';
	export let treeItem: EventTreeItem;
	export let newParent: Writable<string[]>;
	let t: [string, EventTreeItem][];
	$: {
		let _t = [...treeItem.children.entries()].toSorted((_a, _b): number => {
			let [_, a] = _a;
			let [__, b] = _b;
			return b.children.size - a.children.size;
		});

		t = _t.filter(([id, item]) => {
			return item.event.kind == 1;
		});
	}
</script>
<div class="mt-2"></div>
{#each t as [id, tree], i (id)}
	<div class="w-full">
		<div class="grid">
			<div class="flex gap-2">
				<img
					class="w-8 h-8 rounded-full"
					src="https://zenquotes.io/img/marcus-aurelius.jpg"
					alt="profile pic"
				/>
				<div class="grid">
					<h5 class="text-gray-900 dark:text-orange-600 font-semibold leading-snug pb-1">Marcus</h5>
					<div class="grid overflow-hidden mr-2">
						<div class="px-3.5 py-2 bg-gray-200 dark:bg-gray-700 rounded-e-xl rounded-es-xl flex flex-col gap-2">
							<h5 class="text-sm font-normal text-gray-900 dark:text-white py-2">
								<RenderNoteContent inputString={tree.event.content} />
							</h5>
							<div class="flex justify-between">
								<div><Marcus onclick={()=>{alert("implement me!")}} {tree} /></div>

								<div>
									<Zap onclick={()=>{alert("implement me!")}} {tree}/>
									<Reply
										onclick={() => {
											console.log(48);
											newParent.update((existing) => {
												existing.push(id);
												return existing;
											});
										}}
										{tree}
									/>
								</div>
							</div>
						</div>
						<div class="justify-end items-center inline-flex mb-2.5">
							<h6 class="text-gray-500 text-xs font-normal leading-4 py-1">
								{new Date(tree.event.created_at * 1000).toLocaleString()}
							</h6>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

{/each}
