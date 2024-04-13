import { NDKEvent, type NDKSigner, type NDKTag, type NostrEvent } from "@nostr-dev-kit/ndk";

export class Command {
  command: "start" | "stop" | "connect" | "print" | "nip07";
  pubkey?: string;
  signer?:NDKSigner;
  constructor(
    command: "start" | "stop" | "connect" | "print" | "nip07",
    pubkey?: string
  ) {
    this.signer = this.signer;
    this.command = command;
    this.pubkey = pubkey ? pubkey : "";
  }
}

export class ResponseData {
  connected: number = 0;
  rawCount: number = 0;
  count(): number {
    return this.events.size;
  }
  connections: Map<string, number>;
  errors: Error[];
  events: Map<string, NostrEvent>;
  etags: Map<string, Set<string>>;
  kinds: Map<number, number>;
  rootEvents: Set<string>;
  recursiveEvents: EventTreeItem;
  followLists: Map<string, Set<string>>;
  masterPubkey: string | undefined;
  constructor(pubkey?:string) {
    this.masterPubkey = pubkey;
    this.recursiveEvents = new EventTreeItem({id:"", created_at:0, content:"", tags:[], pubkey:""})
    this.etags = new Map();
    this.followLists = new Map();
    this.connections = new Map();
    this.errors = [];
    this.events = new Map();
    this.kinds = new Map();
    this.rootEvents = new Set();
  }

  PushEvent(ev: NostrEvent): void {
    if (!this.events.has(ev.id!)) {
      this.events.set(ev.id!, ev);
      {
        let existing = this.kinds.get(ev.kind!);
        if (!existing) {
          existing = 0;
        }
        existing++;
        this.kinds.set(ev.kind!, existing);
      }
      if (ev.kind == 3) {
       this.followLists.set(ev.pubkey, new Set(ev.tags.filter((t: NDKTag) => t[0] == 'p').map((t: NDKTag) => t[1]))) 
      }
      if (ev.kind == 1 || ev.kind == 7) {
        let e = new NDKEvent(undefined, ev);
        let found = false;
        for (let t of e.getMatchingTags("e")) {
          if (t[1].length == 64 && !t.includes("root")) {
            let existing = this.etags.get(t[1]);
            if (!existing) {
              existing = new Set<string>();
            }
            existing.add(e.id);
            this.etags.set(t[1], existing);
          }

          if (!t.includes("mention")) {
            found = true;
          }
        }
        if (!found) {
          this.rootEvents.add(ev.id!);
        }
      }
    }
  }
}



function getNestedEvents(events: Map<string, NostrEvent>,
  etags: Map<string, Set<string>>) {

}

export type RecursiveEventMap = Map<string, EventTreeItem>;
function PopulateEventMap(
  m: RecursiveEventMap,
  nempool: Map<string, NDKEvent>
) {
  m.forEach((treeItem) => {
    if (treeItem.dirty) {
    }
  });
}

export class EventTreeItem {
  //id: string; //if we have replies etc but don't have the event itself we need to fetch it
  event: NostrEvent; //pseudo event if root
  children: RecursiveEventMap;
  allChildrenInMap():Set<string> {
    return iterate(this.children)
  }
  findChild(id:string):EventTreeItem | undefined {
    return find(this.children, id)
  }
  reacts(): Map<string, NostrEvent> {
    let m: Map<string, NostrEvent> = new Map();
    for (let [id, { event }] of this.children) {
      if (event.kind! == 7) {
        m.set(id, event);
      }
    }
    return m;
  }
  push(ev: NDKEvent) {
    for (let t of ev.getMatchingTags("e")) {
      if (t.includes(this.event.id!)) {
        if (!this.children.has(ev.id)) {
          this.children.set(ev.id, new EventTreeItem(ev.rawEvent()));
        }
      }
    }
  }
  dirty: boolean;
  root: string | undefined;
  constructor(e: NostrEvent) {
    this.dirty = true;
    this.event = e;
    this.children = new Map();
  }
}

function iterate(m:RecursiveEventMap):Set<string> {
  let s = new Set<string>()
  for (let [id, item] of m) {
    iterate(item.children)
    s.add(id);
  }
  return s
}

function find(m:RecursiveEventMap, id:string):EventTreeItem | undefined {
  if (m.get(id)) {return m.get(id)!}
  for (let [_, item] of m) {
    let c = find(item.children, id)
    if (c) {
      return c
    }
  }
}