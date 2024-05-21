<script lang="ts">
	import { FrontendDataStore } from '@/snort_workers/main';
	import { kind0 } from '@/stores/user';
	import { System } from '@/views/messages/snort';
	import { RequestBuilder, type QueryLike } from '@snort/system';
	import { nip19 } from 'nostr-tools';
	import { onDestroy, onMount } from 'svelte';
	import { derived, writable } from 'svelte/store';

	export let pubkey: string;


	let q: QueryLike;

	let imageLoaded = false;
	const profilePic = writable('');

	function handleImageLoad() {
		imageLoaded = true;
	}

	onMount(() => {
		if (pubkey && pubkey.length == 64) {
			if (!$kind0.get(pubkey)) {
				const rb = new RequestBuilder(pubkey);
				rb.withFilter().authors([pubkey]).kinds([0]);
				rb.withOptions({ leaveOpen: false });
				q = System.Query(rb);
				q.on('event', (evs) => {
					if (evs.length > 0) {
						kind0.update((existing) => {
							for (let e of evs) {
								let _existing = existing.get(e.pubkey);
								if (!_existing || (_existing && _existing.created_at <= e.created_at)) {
									existing.set(e.pubkey, e);
								}
							}
							return existing;
						});
					}
				});
			}
		}
	});
	onDestroy(() => {
		if (q) {
			q.cancel();
		}
	});

$: {
		const content = $kind0.get(pubkey)?.content;
			let picture = '';
			if (content) {
				try {
					const json = JSON.parse(content);
				if (json.picture && json.picture.length > 6) {
					picture = json.picture;
				}
			} catch {
				profilePic.set("https://assets.americanmeadows.com/media/catalog/product/h/o/horse-pasture-and-hay-seed-mix-horse.jpg")
			}
		}
			profilePic.set(picture);
}

</script>
<img
class="w-8 h-8 rounded-full ring-2 {$FrontendDataStore.baseFollows.has(pubkey)?"ring-orange-500":"ring-gray-500"}"
src={$profilePic}
alt=""
width="32px"
height="32px"
on:load={handleImageLoad}
/>
