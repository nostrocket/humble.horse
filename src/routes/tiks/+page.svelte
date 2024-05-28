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
								Imagine if you could highlight podcasts and videos the same way you can highlight notes. 
							</p>

                            <p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								Humble Horse will enable you to highlight timestamps within podcasts/videos and publish them in a way that any existing nostr client will be able to play them and let people comment on them.
							</p>

							<p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								These highlights will be called "tiks" until someone comes up with a better name.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</ChatLayout>
