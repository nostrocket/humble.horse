import type { TaggedNostrEvent } from '@snort/system';
import type { Event } from 'nostr-tools';

export function getNostrEvent(ev: TaggedNostrEvent): Event {
	return {
		id: ev.id,
		created_at: ev.created_at,
		content: ev.content,
		tags: ev.tags,
		pubkey: ev.pubkey,
		sig: ev.sig,
		kind: ev.kind
	};
}

export function followsFromKind3(event:Event):Set<string> {
	return new Set(event.tags.filter((t) => t[0] == 'p').map((t) => t[1]))
}