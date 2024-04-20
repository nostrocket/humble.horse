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
					src="https://zenquotes.io/img/marcus-aurelius.jpg"
					alt="profile pic"
				/>
				<div class="grid">
					<h5 class="text-gray-900 dark:text-orange-600 font-semibold leading-snug pb-1">Marcus</h5>
					<div class="grid overflow-hidden mr-2">
						<div
							class="px-3.5 py-2 bg-gray-200 dark:bg-gray-700 rounded-e-xl rounded-es-xl flex flex-col gap-2"
						>
							<p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								Of all people, they alone who give their time to philosophy are at leisure, they
								alone really live. For it's not just their own lifetime that they watch over
								carefully, but they annex every age to their own; all the years that have gone
								before are added to their own.
							</p>

                            <p class="text-sm font-normal text-gray-900 dark:text-white py-2">
								When you click the Marcus button on any note, it will be saved here to your list of personal meditations so that I can remind you to add them to your life.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</ChatLayout>
