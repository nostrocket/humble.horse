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
								Humble Horse is an experiment in making nostr into a giant group chat with no global state. Instead of creating discrete groups like telegram, every nostr thread is a group.
							</p>
							<p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								The problem with telegram groups is the velocity is either too slow to be interesting or too fast to be useful.
							</p>

							<p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								The goal here is to be able to "move" the nostr client throughout the nostrverse to dynamically create "groups" with the right velocity of content, and to present the user with the best "groups" based on the interests (as demonstrated through their engagement with others).
							</p>

                            <p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								Bloom filter events (NIP coming soon) are used to prevent the user seeing "groups" more than once (if they have scrolled past them and shown no interest).
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
