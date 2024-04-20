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

export class WorkerData {
	missingEvents: Set<string>;
	roots: Set<string>;
	replies: Map<string, Set<string>>;
	events: Map<string, NostrEvent>;
	_ourPubkey: string | undefined;
	_ourFollows: Set<string>;
	ourPubkey(): string {
		return this._ourPubkey
			? this._ourPubkey
			: 'd91191e30e00444b942c0e82cad470b32af171764c2275bee0bd99377efd4075';
	};
    setOurPubkey(pubkey:string) {
        if (pubkey.length != 64) {throw new Error("invalid pubkey")}
        this._ourPubkey = pubkey
    }
    setOurFollows(follows:Set<string> | string[]):void {
        this._ourFollows = new Set<string>([...follows].filter(v=>{
            return v.length == 64
        }))
    }
    latestReplaceable: Map<string, Map<string, NostrEvent>>
	constructor(pubkey?: string) {
		this.missingEvents = new Set()
        this.latestReplaceable = new Map()
		this.events = new Map();
        if (pubkey && pubkey.length == 64) {
            this._ourPubkey = pubkey
        }
		this._ourFollows = new Set();
		this.roots = new Set();
		this.replies = new Map()
	}
}

export class FrontendData {
	roots: NostrEvent[];
	replies: Map<string, Set<string>>
	basePubkey: string;
	baseFollows: Set<string>
	events: Map<string, NostrEvent>;
	missingEvents: Set<string>;
	constructor() {
		this.missingEvents = new Set()
		this.roots = []
		this.replies = new Map()
		this.baseFollows = new Set()
		this.events = new Map()
	}
}