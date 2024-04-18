import type { NDKEvent } from "@nostr-dev-kit/ndk"

export class tagSplits {
    id: string
    roots: Set<string>
    replies: Set<string>
    mentions: Set<string>
    unlabelled: Set<string>
    unknown: Set<string>
    All():Set<string> {
        return new Set(...this.roots, this.replies, this.mentions, this.unlabelled, this.unknown)
    }
    constructor(event: NDKEvent) {
        this.id = event.id;
        this.roots = new Set<string>();
        this.replies = new Set<string>();
        this.mentions = new Set<string>();
        this.unlabelled = new Set<string>();
        this.unknown = new Set<string>();
        let tags = event.getMatchingTags('e');
        for (const [i, tag] of tags.entries()) {
            if (tag[1] && tag[1].length == 64) {
                if (tag.includes('root')) {
                    this.roots.add(tag[1]);
                } else if (tag.includes('mention')) {
                    this.mentions.add(tag[1]);
                } else if (tag.includes('reply')) {
                    this.replies.add(tag[1]);
                } else if (
                    tag.length == 2 ||
                    tag[tag.length - 1] == '' ||
                    tag[tag.length - 1].includes('://')
                ) {
                    this.unlabelled.add(tag[1]);
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