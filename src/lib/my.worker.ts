import NDKSvelte, { type ExtendedBaseType, type NDKEventStore } from '@nostr-dev-kit/ndk-svelte';
import { get, writable } from 'svelte/store';
import { ndk } from './ndk';
import type { NDKEvent } from '@nostr-dev-kit/ndk';

let _ndk = writable(
	new NDKSvelte({
		//cacheAdapter: new NDKCacheAdapterDexie({ dbName: 'wiki' }), //disabled becasue it uses way too much memory and slows everything down
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
		enableOutboxModel: false
	})
);

let connected = false;
let connecting = false;

export interface PostMessageDataRequest {
	text: string;
  events?: Map<string, NDKEvent>
}

export interface PostMessageDataResponse {
	text: string;
}

export type PostMessageRequest = 'request1' | 'start' | 'stop';
export type PostMessageResponse = 'response1' | 'response2';

export interface PostMessage<T extends PostMessageDataRequest | PostMessageDataResponse> {
	data?: T;
}

onmessage = ({ data: { data } }: MessageEvent<PostMessage<PostMessageDataRequest>>) => {
	console.log(data?.text);
	if ( data?.text === "start" && !connected && !connecting) {
		connecting = true;
		get(_ndk)
			.connect(5000)
			.then(() => {
				connected = true;
				console.log('ww connected');
				let firehose = get(_ndk).storeSubscribe(
					[{ authors: ['d91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075'] }],
					{ subId: 'firehose' }
				);

        firehose.subscribe(evts=>{
          console.log(64, evts.length)
          let events = new Map<string, NDKEvent>();
          for (let event of evts) {
            if (!events.has(event.id)) {
              events.set(event.id, event)
            }
          }
          const message: PostMessage<PostMessageDataRequest> = {
            data: { text: 'a', events: events }
          };
          console.log(73, message)
          postMessage(message);
          console.log(75)
        })


				//firehose.subscribe((state) => {});
			});
	}
};

export {};
