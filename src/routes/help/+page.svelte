<script>
	import ChatLayout from '@/components/ChatLayout.svelte';
</script>
<ChatLayout>
	<div slot="buttons"></div>
	<div class="pt-2"></div>
	<div class="w-full">
		<div class="grid pb-11">
			<div class="flex gap-2.5 mb-4">
				<img
					class="w-8 h-8 rounded-full"
					src="https://assets.americanmeadows.com/media/catalog/product/h/o/horse-pasture-and-hay-seed-mix-horse.jpg"
					alt="profile pic"
				/>
				<div class="grid">
					<h5 class="text-gray-900 dark:text-orange-600 font-semibold leading-snug pb-1">Horsey McHorseface</h5>
					<div class="grid overflow-hidden mr-2">
						<div
							class="px-3.5 py-2 bg-gray-200 dark:bg-gray-700 rounded-e-xl rounded-es-xl flex flex-col gap-2"
						>
							<p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								Humble Horse is an experiment in making nostr into a giant group chat. Instead of creating discrete groups, we "move" the nostr client over conversations based on heuristics to dynamically "create" groups based on what content the user is interested in. I have some ideas on how to find optimise for presenting the user with the best "groups" so keep watching the progress.
							</p>

                            <p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								Bloom filter events are used to prevent the user seeing "groups" that they are not interest in more than once.
							</p>

							<p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								Users will also be encouraged to reply in an existing group rather than creating a new air reply, we do this by presenting them with existing groups that are similar to whatever they have started writing in the message input box.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</ChatLayout>
