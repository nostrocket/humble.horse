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
								Humble Horse is a <a href="https//nostrocket.org">Nostrocket</a> project, which means it is owned by contributors and any revenue it generates will split between all people who worked on it in proportion to the work they have done.
							</p>

                            <p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								Once this is implemented, you'll be able to see the distribution of Humble Horse merits on this page (something kind of similar to shares in a company).
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</ChatLayout>
