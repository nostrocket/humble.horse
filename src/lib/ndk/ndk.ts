import { seedRelays, short } from '@/snort_workers/seed_relays';
import type { NDKUser } from '@nostr-dev-kit/ndk';
import NDKSvelte from '@nostr-dev-kit/ndk-svelte';
import { writable } from 'svelte/store';

export const currentUser = writable<NDKUser | undefined>(undefined);

const _ndk: NDKSvelte = new NDKSvelte({
	explicitRelayUrls: short
});

export const ndk = writable(_ndk);

let connected = false;

export async function connect() {
	if (!connected) {
		connected = true;
		try {
			await _ndk.connect();
			console.log('NDK connected');
		} catch (e) {
			console.error(e);
		}
	}
}