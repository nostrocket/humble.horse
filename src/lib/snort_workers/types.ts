
import { Rake } from '@/rake/rake';
import { BloomFilter } from 'bloomfilter';
import type { NostrEvent } from 'nostr-tools';

export class Command {
	command: 'start' | 'sub_to_pubkeys' | 'fetch_events' | 'push_event' | 'ping';
	pubkey?: string;
	pubkeys?: string[];
	events?: string[];
	event?: NostrEvent[];
	constructor(command: 'start' | 'sub_to_pubkeys' | 'fetch_events' | 'push_event' | 'ping') {
		this.command = command;
	}
}


export class RakeWords {
	processedIDs: BloomFilter | undefined;
	processedThisSession: Set<string>;
	words: Map<string, number>;
	public hitcount(input: string):number {
		let r = new Rake()
		let _words = r.splitPhrases(input)
		let count = 0
		for (let w of _words) {
			let val = this.words.get(w)
			if (val) {
				count = count + val
			}
		}
		return count
	}

	constructor() {
		//todo construct from RAKE event if we find one
		this.words = new Map()
		this.processedIDs = undefined;
		this.processedThisSession = new Set()
	}
}

export class WorkerData {
	rake: RakeWords;
	missingEvents: Set<string>;
	roots: Set<string>;
	replies: Map<string, Set<string>>;
	events: Map<string, NostrEvent>;
	_ourPubkey: string | undefined;
	ourFollows: Set<string>;
	ourBloom: BloomFilter;
	bloomSize: number;
	ourPubkey(): string {
		return this._ourPubkey
			? this._ourPubkey
			: 'd91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075';
	}
	setOurPubkey(pubkey: string) {
		if (pubkey.length != 64) {
			throw new Error('invalid pubkey');
		}
		this._ourPubkey = pubkey;
	}
	setOurFollows(follows: Set<string> | string[]): void {
		this.ourFollows = new Set<string>(
			[...follows].filter((v) => {
				return v.length == 64;
			})
		);
	}
	serializeBloom():string {
		let a = [].slice.call(this.ourBloom.buckets)
		let json = JSON.stringify(a)
		return json
	}
	latestReplaceable: Map<string, Map<string, NostrEvent>>;
	constructor(pubkey?: string) {
		this.rake = new RakeWords();
		this.bloomSize = 0;
		this.ourBloom = new BloomFilter(
			64 * 256, // bits to allocate.
			32 // number of hashes
		);
		this.missingEvents = new Set();
		this.latestReplaceable = new Map();
		this.events = new Map();
		if (pubkey && pubkey.length == 64) {
			this._ourPubkey = pubkey;
		}
		this.ourFollows = new Set();
		this.roots = new Set();
		this.replies = new Map();
	}
}

export class FrontendData {
	keywords: Map<string, number>;
	rootsByKeyword: string[];
	rootsByReplies: string[];
	replies: Map<string, Set<string>>;
	baseFollows: Set<string>;
	events: Map<string, NostrEvent>;
	ourBloom: BloomFilter | undefined;
	_bloomString: string | undefined;
	constructor() {
		this.rootsByReplies = []
		this.keywords = new Map()
		this.rootsByKeyword = [];
		this.replies = new Map();
		this.baseFollows = new Set();
		this.events = new Map();
	}
}
