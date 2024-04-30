
import { Rake } from '@/rake/rake';
import { BloomFilter } from 'bloomfilter';
import type { NostrEvent } from 'nostr-tools';

export class Command {
	command: 'start' | 'sub_to_pubkeys' | 'fetch_events' | 'push_event' | 'ping' | 'set_master_pubkey';
	pubkey?: string;
	pubkeys?: string[];
	events?: string[];
	event?: NostrEvent[];
	constructor(command: 'start' | 'sub_to_pubkeys' | 'fetch_events' | 'push_event' | 'ping' | 'set_master_pubkey') {
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
			: 'd926c9849295e7d75a7eba75428e633ce66fd06f6c88ced88edc0950fa761484'//'d91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075';
	}
	setOurPubkey(pubkey: string) {
		if (pubkey.length != 64) {
			throw new Error('invalid pubkey');
		}
		// if (this._ourPubkey != pubkey) {
		// 	this.reset(pubkey)
		// }
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

	reset(pubkey:string):void {
		this.bloomSize = 0;
		this.ourBloom = new BloomFilter(
			64 * 256, // bits to allocate.
			32 // number of hashes
		);
		this.ourFollows = new Set()
		this.roots = new Set()
		this._ourPubkey =  pubkey
		this.rake.processedThisSession = new Set()
		this.rake.words = new Map()
		this.roots = new Set()
		this.replies = new Map()
		this.missingEvents = new Set();
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
