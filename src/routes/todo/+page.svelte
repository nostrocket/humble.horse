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
								I sometimes want to bookmark a note so I can reply to it later, or take some action based on it. But the UI I want is a bit different to the typical bookmark UI implemented in nostr clients so far, so I'm going to implement it here.
							</p>

						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</ChatLayout>
