import NDKSvelte from '@nostr-dev-kit/ndk-svelte';
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie';

import { writable } from 'svelte/store';

export const ndk = writable(
	new NDKSvelte({
		cacheAdapter: new NDKCacheAdapterDexie({ dbName: 'wiki' }),
		explicitRelayUrls: [
			'wss://purplepag.es',
			'wss://relay.nostr.band',
			'wss://nos.lol',
			'wss://relay.wikifreedia.xyz',
			'wss://relay.nostrocket.org',
			'wss://search.nos.today',
			'wss://relay.damus.io',
			'wss://relay.nostr.bg',
			'wss://relay.snort.social',
			'wss://offchain.pub',
			'wss://relay.primal.net',
			'wss://pyramid.fiatjaf.com'
		],
		enableOutboxModel: true
	})
);
