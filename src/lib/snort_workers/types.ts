import type { Event, NostrEvent } from 'nostr-tools';

export class Command {
	command: 'start' | 'sub_to_pubkeys';
	pubkey?: string;
	pubkeys?: string[];
	constructor(command: 'start' | 'sub_to_pubkeys') {
		this.command = command;
	}
}

export class WorkerData {
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
        this.latestReplaceable = new Map()
		this.events = new Map();
        if (pubkey && pubkey.length == 64) {
            this._ourPubkey = pubkey
        }
		this._ourFollows = new Set();
	}
}

export class FrontendData {
	roots: NostrEvent[];
	replies: Map<string, Set<NostrEvent>>
	basePubkey: string;
	baseFollows: Set<string>
	constructor() {
		this.roots = []
		this.replies = new Map()
		this.baseFollows = new Set()
	}
}