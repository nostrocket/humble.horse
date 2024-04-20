<script lang="ts">
	import { kind0 } from '@/stores/user';
	import { System } from '@/views/messages/snort';
	import { RequestBuilder, type QueryLike } from '@snort/system';
	import { nip19 } from 'nostr-tools';
	import { onDestroy, onMount } from 'svelte';
	import { derived } from 'svelte/store';

	export let pubkey: string;
	let q: QueryLike;

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

	let displayName = derived(kind0, ($kind0) => {
		let content = $kind0.get(pubkey)?.content;
		let name = nip19.npubEncode(pubkey).substring(0, 12);
		if (content) {
			try {
				let json = JSON.parse(content);
				if (json.Name && json.Name.length > 0) {
					name = json.Name;
				} else if (json.display_name && json.display_name.length > 0) {
					name = json.display_name;
				} else if (json.name && json.name.length > 0) {
					name = json.name;
				}
			} catch {}
		}
		return name;
	});
</script>

{$displayName}
