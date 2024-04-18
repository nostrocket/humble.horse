import { NDKEvent, type NostrEvent } from '@nostr-dev-kit/ndk';
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

export class tagSplits {
    id: string
	rawEvent: NostrEvent;
	thisIsRoot:boolean;
    roots: Set<string>
    replies: Set<string>
    mentions: Set<string>
    unlabelled: Set<string>
    unknown: Set<string>
    All():Set<string> {
        return new Set(...this.roots, this.replies, this.mentions, this.unlabelled, this.unknown)
    }
    constructor(event: NostrEvent) {
		this.rawEvent = event
		let ndk_event = new NDKEvent(undefined, event)
        this.id = ndk_event.id;
        this.roots = new Set<string>();
        this.replies = new Set<string>();
        this.mentions = new Set<string>();
        this.unlabelled = new Set<string>();
        this.unknown = new Set<string>();
		this.thisIsRoot = true
        let tags = ndk_event.getMatchingTags('e');
        for (const [i, tag] of tags.entries()) {
            if (tag[1] && tag[1].length == 64) {
                if (tag.includes('root')) {
                    this.roots.add(tag[1]);
					this.thisIsRoot = false;
                } else if (tag.includes('mention')) {
                    this.mentions.add(tag[1]);
                } else if (tag.includes('reply')) {
                    this.replies.add(tag[1]);
					this.thisIsRoot = false;
                } else if (
                    tag.length == 2 ||
                    tag[tag.length - 1] == '' ||
                    tag[tag.length - 1].includes('://')
                ) {
                    this.unlabelled.add(tag[1]);
					this.thisIsRoot = false;
                } else {
                    this.unknown.add(tag[1]);
                }
            }
        }
        if (this.replies.size == 0 && this.unlabelled.size == 1) {
            this.replies.add([...this.unlabelled][0]);
        }
    }
}