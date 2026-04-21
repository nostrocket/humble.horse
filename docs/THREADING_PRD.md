# PRD: Nostr Reply-Tree Construction

**Status**: Reference specification, derived from `humble.horse` implementation
**Audience**: Engineers implementing a Nostr client that must reconstruct kind-1 reply threads from a stream of events
**Source of truth**: `src/lib/snort_workers/utils.ts` in the humble.horse repo

---

## 1. Context

NIP-10 specifies how kind-1 events should reference parents and roots via `e` tags with `'root'`, `'reply'`, and `'mention'` markers. In practice, clients in the wild produce four pathologies:

1. No markers (legacy "deprecated positional" form, sometimes with relay URL hints).
2. Wrong markers (`'mention'` used where `'reply'` was meant, two `'root'` tags, etc.).
3. Duplicate / repeated `e` tags.
4. Missing intermediate ancestors entirely.

A naive reader that takes markers at face value will produce an incoherent reply tree. This PRD specifies an algorithm that:

- Tolerates all four pathologies.
- Produces a deterministic `parent → children` map suitable for rendering threads.
- Tracks events that *should* exist (referenced as ancestors) but haven't arrived yet, so a fetcher can request them.
- Is safe to re-run incrementally over a growing event corpus.

The goal is for an implementer in any language to be able to drop this into their own client and produce the same threading behavior.

## 2. Glossary

| Term | Definition |
|---|---|
| **Event** | A Nostr event object: `{id, pubkey, kind, created_at, content, tags, sig}`. Only kind-1 events participate in this algorithm; other kinds are ignored. |
| **`e` tag** | A tag with first element `'e'` and second element a 64-char hex event id. May have a relay-url hint at index 2 and a marker at index 3 (`'root'`, `'reply'`, `'mention'`). |
| **Marker** | The conventional NIP-10 string at any position in the tag (we check `tag.includes(...)`, not a fixed index, because clients vary). |
| **Root** | An event id that some other event has explicitly tagged as the conversation root. |
| **Parent** | The single event id that a given reply event is a direct child of. |
| **Reply map** | `Map<parentId, Set<childId>>` — direct children only, no transitive descendants. |
| **Roots set** | `Set<eventId>` — ids known to be the root of at least one observed reply chain. |
| **Missing events** | `Set<eventId>` — ids referenced by tags we've processed but whose event body we don't yet hold. |
| **Corpus** | The current set of events the algorithm has been told about: `Map<id, Event>`. |

## 3. Functional requirements

Each requirement has a stable ID. The reference implementation in §6 is annotated with these IDs in inline comments.

### FR-1: Per-event tag classification (`tagSplits`)

| ID | Requirement |
|---|---|
| **FR-1.1** | For a given event, read all tags whose first element equals `'e'`. |
| **FR-1.2** | For each such tag, ignore it unless `tag[1]` exists and is exactly 64 characters. (Validates it's a hex event id; lower bound — full hex validation is optional but recommended.) |
| **FR-1.3** | Bucket the id at `tag[1]` into exactly one of: `roots`, `replies`, `mentions`, `unlabelled`, `unknown`. |
| **FR-1.4** | Bucketing precedence: if `tag.includes('root')` → `roots`; else if `tag.includes('mention')` → `mentions`; else if `tag.includes('reply')` → `replies`; else apply FR-1.5. |
| **FR-1.5** | Treat as `unlabelled` (legacy positional form) if any of: `tag.length == 2`, OR the last element is the empty string, OR the last element contains `'://'` (it's a relay URL hint). |
| **FR-1.6** | Otherwise classify as `unknown`. (Useful for surfacing telemetry; not used by the threading algorithm.) |
| **FR-1.7** | Fallback: if after bucketing `replies.size == 0 && unlabelled.size == 1`, move the unlabelled id into `replies`. |
| **FR-1.8** | Fallback: if after FR-1.7 still `replies.size == 0 && roots.size == 1`, also add the root id to `replies`. (This handles "I'm directly replying to the root.") |
| **FR-1.9** | Compute a derived flag `thisIsRoot` = `true` iff none of the above bucketing assigned to `roots`, `replies`, or `unlabelled`. (Mentions don't disqualify.) `thisIsRoot` is exposed for callers but not used by FR-3. |

### FR-2: Multi-tag disambiguation

When an event presents multiple plausible parents, run a graph-topology check to pick the real one.

| ID | Requirement |
|---|---|
| **FR-2.1** | Trigger the disambiguation pass for an event iff `(replies.size != 1 && unlabelled.size > 1) || replies.size > 1`. |
| **FR-2.2** | Build `candidates = unlabelled ∪ replies`. |
| **FR-2.3** | Look up each candidate id in the corpus. Any candidate not present is added to the missing-events set (FR-5.1) and the disambiguation pass is **aborted** for this event (we cannot disambiguate without full information). |
| **FR-2.4** | If all candidates are present: for each candidate event `c`, run `tagSplits(c)` and collect the union of every id any candidate references via `roots ∪ replies ∪ mentions ∪ unlabelled ∪ unknown`. Call this set `referenced`. |
| **FR-2.5** | Compute `survivors = candidates \ referenced` — the candidates that no other candidate references. |
| **FR-2.6** | If `survivors.size == 1`, overwrite `replies` with that single id. (It is the parent — the deepest id in the chain.) |
| **FR-2.7** | If `survivors.size != 1`, leave `replies` unchanged. The event remains unattached for this pass and may be resolved on a later pass when more events arrive. |

**Rationale (informative, not normative)**: In a chain `R → A → B → C`, if `C` mistags both `A` and `B` as candidate parents, `B` is the actual parent. `B` references `A`, so `A` is in `referenced`. `B` is not referenced by any other candidate, so `B` is the survivor.

### FR-3: Roots set population

| ID | Requirement |
|---|---|
| **FR-3.1** | An event id `r` is added to the roots set **only** when some other processed event's `tagSplits.roots` contains `r`. |
| **FR-3.2** | An event with no `e` tags (or only `mention` tags) is **never** added to the roots set by virtue of itself. It enters the roots set only when something replies to it with a `'root'` marker. |
| **FR-3.3** | Implementations MAY expose `tagSplits.thisIsRoot` (FR-1.9) so callers can build a separate "self-asserted root" view, but the canonical roots set is FR-3.1. |

**Design note (informative)**: This is opinionated. It means a brand-new top-level post with no replies will never appear in a feed driven by the roots set. humble.horse uses this to focus the feed on threads with engagement; other clients may want the alternative ("an event is a root if its own tags don't reference any parent") and should diverge here.

### FR-4: Reply map population

| ID | Requirement |
|---|---|
| **FR-4.1** | After tag classification + FR-1.7/1.8 fallbacks + FR-2 disambiguation, an event is added to the reply map iff `replies.size == 1` for that event. |
| **FR-4.2** | The reply map is `Map<parentId, Set<childId>>`. Adding an event with parent `p` and id `c` does `replies[p] ← (replies[p] ∪ {c})`. |
| **FR-4.3** | The map records direct children only. Implementations that need transitive descendants must compute them at read-time, not store them. |
| **FR-4.4** | Events with `replies.size != 1` after all passes are silently skipped from the reply map. They remain in the corpus and may be re-evaluated on the next pass. |

### FR-5: Missing events tracking

| ID | Requirement |
|---|---|
| **FR-5.1** | When processing an event, any id appearing in its `tagSplits.roots` that is not present in the corpus is added to `missingEvents`. Any id in `candidates` (FR-2.2) that is not present is also added. |
| **FR-5.2** | When the algorithm begins processing an event with id `i`, `missingEvents.delete(i)` is called first (we now have it). |
| **FR-5.3** | Implementations SHOULD use `missingEvents` to drive a fetch loop against relays, but the fetcher is out of scope for this PRD. |

### FR-6: Idempotency and incremental re-processing

| ID | Requirement |
|---|---|
| **FR-6.1** | The algorithm operates on the entire corpus on each invocation. Calling it twice on the same corpus must produce identical `roots`, `replies`, and `missingEvents`. |
| **FR-6.2** | Adding new events to the corpus and re-invoking must produce a result equivalent to processing the merged corpus from scratch. (No event-order dependence on results.) |
| **FR-6.3** | Implementations MAY optimize by processing only deltas, but MUST preserve the property of FR-6.2. |

## 4. Non-functional requirements

| ID | Requirement |
|---|---|
| **NFR-1** | Worst-case complexity per invocation: `O(E × T)` where `E` is corpus size and `T` is average `e`-tag count per event. Disambiguation adds `O(C × T_c)` per triggering event where `C` is candidate count for that event. |
| **NFR-2** | The algorithm must not depend on event arrival order. |
| **NFR-3** | The algorithm must run off the UI thread when corpus exceeds a few hundred events (humble.horse runs it in a Web Worker; native clients should use a background thread or async task). |
| **NFR-4** | The algorithm must accept events lacking a `sig` field (validation is the caller's job). |

## 5. Algorithm specification (language-agnostic pseudocode)

```
function classify(event) -> TagSplits:                     # FR-1
    splits = TagSplits(roots={}, replies={}, mentions={},
                       unlabelled={}, unknown={}, thisIsRoot=true)
    for tag in event.tags where tag[0] == 'e':             # FR-1.1
        if len(tag) < 2 or len(tag[1]) != 64: continue     # FR-1.2
        id = tag[1]
        if 'root'    in tag: splits.roots.add(id);     splits.thisIsRoot=false
        elif 'mention' in tag: splits.mentions.add(id)
        elif 'reply'   in tag: splits.replies.add(id);   splits.thisIsRoot=false
        elif len(tag) == 2 or tag[-1] == '' or '://' in tag[-1]:
            splits.unlabelled.add(id);                   splits.thisIsRoot=false
        else: splits.unknown.add(id)                       # FR-1.3..1.6

    if len(splits.replies) == 0 and len(splits.unlabelled) == 1:    # FR-1.7
        splits.replies = set(splits.unlabelled)
    if len(splits.replies) == 0 and len(splits.roots) == 1:          # FR-1.8
        splits.replies = set(splits.roots)
    return splits


function updateThreading(corpus, roots, replyMap, missing):  # FR-6
    for (id, event) in corpus:
        missing.discard(id)                                  # FR-5.2
        splits = classify(event)

        for r in splits.roots:                               # FR-3.1, FR-5.1
            if r in corpus: roots.add(r)
            else:           missing.add(r)

        # FR-2: disambiguation
        ambiguous = (len(splits.replies) != 1 and len(splits.unlabelled) > 1) \
                    or len(splits.replies) > 1
        if ambiguous:
            candidates = splits.unlabelled | splits.replies
            present = {c: corpus[c] for c in candidates if c in corpus}
            for c in candidates - present.keys():
                missing.add(c)
            if len(present) == len(candidates):              # all present (FR-2.3)
                referenced = {}
                for c_event in present.values():             # FR-2.4
                    cs = classify(c_event)
                    referenced |= cs.roots | cs.replies | cs.mentions \
                                | cs.unlabelled | cs.unknown
                survivors = candidates - referenced          # FR-2.5
                if len(survivors) == 1:
                    splits.replies = set(survivors)          # FR-2.6

        if len(splits.replies) == 1:                         # FR-4.1
            parent = next(iter(splits.replies))
            replyMap.setdefault(parent, set()).add(id)       # FR-4.2
```

## 6. Reference implementation (TypeScript)

This is a portable, dependency-free port of `src/lib/snort_workers/utils.ts`. Comments tag each block with the FR it satisfies.

```ts
export type EventTag = string[];
export interface NostrEvent {
  id: string;
  kind: number;
  pubkey: string;
  content: string;
  tags: EventTag[];
  created_at: number;
  sig?: string;
}

export interface TagSplits {
  roots: Set<string>;
  replies: Set<string>;
  mentions: Set<string>;
  unlabelled: Set<string>;
  unknown: Set<string>;
  thisIsRoot: boolean;
}

const HEX64 = /^[0-9a-f]{64}$/i;

// FR-1
export function classify(event: NostrEvent): TagSplits {
  const splits: TagSplits = {
    roots: new Set(),
    replies: new Set(),
    mentions: new Set(),
    unlabelled: new Set(),
    unknown: new Set(),
    thisIsRoot: true,
  };

  for (const tag of event.tags) {
    if (tag[0] !== 'e') continue;                            // FR-1.1
    const id = tag[1];
    if (!id || id.length !== 64 || !HEX64.test(id)) continue; // FR-1.2

    if (tag.includes('root')) {                              // FR-1.4
      splits.roots.add(id);
      splits.thisIsRoot = false;
    } else if (tag.includes('mention')) {
      splits.mentions.add(id);
    } else if (tag.includes('reply')) {
      splits.replies.add(id);
      splits.thisIsRoot = false;
    } else if (
      tag.length === 2 ||
      tag[tag.length - 1] === '' ||
      tag[tag.length - 1].includes('://')                    // FR-1.5
    ) {
      splits.unlabelled.add(id);
      splits.thisIsRoot = false;
    } else {
      splits.unknown.add(id);                                // FR-1.6
    }
  }

  if (splits.replies.size === 0 && splits.unlabelled.size === 1) { // FR-1.7
    splits.replies = new Set(splits.unlabelled);
  }
  if (splits.replies.size === 0 && splits.roots.size === 1) {      // FR-1.8
    splits.replies = new Set(splits.roots);
  }
  return splits;
}

export interface ThreadingState {
  corpus: Map<string, NostrEvent>;
  roots: Set<string>;
  replyMap: Map<string, Set<string>>;
  missing: Set<string>;
}

// FR-6
export function updateThreading(state: ThreadingState): void {
  for (const [id, event] of state.corpus) {
    if (event.kind !== 1) continue;            // scope: only kind-1
    state.missing.delete(id);                  // FR-5.2

    let splits = classify(event);

    for (const r of splits.roots) {            // FR-3.1, FR-5.1
      if (state.corpus.has(r)) state.roots.add(r);
      else state.missing.add(r);
    }

    const ambiguous =                          // FR-2.1
      (splits.replies.size !== 1 && splits.unlabelled.size > 1) ||
      splits.replies.size > 1;

    if (ambiguous) {
      const candidates = new Set<string>([...splits.unlabelled, ...splits.replies]); // FR-2.2
      const present = new Map<string, NostrEvent>();
      let allPresent = true;
      for (const c of candidates) {
        const ev = state.corpus.get(c);
        if (ev) present.set(c, ev);
        else { state.missing.add(c); allPresent = false; }   // FR-2.3
      }
      if (allPresent && present.size > 0) {
        const referenced = new Set<string>();                // FR-2.4
        for (const ev of present.values()) {
          const cs = classify(ev);
          for (const s of [cs.roots, cs.replies, cs.mentions, cs.unlabelled, cs.unknown]) {
            for (const x of s) referenced.add(x);
          }
        }
        const survivors = new Set<string>();                 // FR-2.5
        for (const c of candidates) if (!referenced.has(c)) survivors.add(c);
        if (survivors.size === 1) {                          // FR-2.6
          splits.replies = survivors;
        }
      }
    }

    if (splits.replies.size === 1) {                         // FR-4.1
      const parent = [...splits.replies][0];
      let kids = state.replyMap.get(parent);
      if (!kids) { kids = new Set(); state.replyMap.set(parent, kids); }
      kids.add(id);                                          // FR-4.2
    }
  }
}
```

## 7. Acceptance test vectors

Implementers should pass all of the following. Each test gives a corpus and the expected `roots`, `replyMap`, and `missing` after one `updateThreading` invocation. (Pubkey/sig/created_at omitted for brevity — set them to anything valid.)

### TV-1: Lone post, no e-tags (FR-3.2)

```
events:
  X = {id: 'aaaa…aaaa', kind: 1, content: 'hello', tags: []}
expected:
  roots:    {}
  replyMap: {}
  missing:  {}
```
*Asserts: an event with no `e` tags is invisible to the roots set.*

### TV-2: Marked reply with root + reply (FR-1.4, FR-3.1, FR-4.1)

```
events:
  R = {id: 'aaaa…aaaa', kind: 1, tags: []}
  A = {id: 'bbbb…bbbb', kind: 1,
       tags: [['e','aaaa…aaaa','','root'],
              ['e','aaaa…aaaa','','reply']]}
expected:
  roots:    {'aaaa…aaaa'}
  replyMap: {'aaaa…aaaa' → {'bbbb…bbbb'}}
  missing:  {}
```

### TV-3: Single-unlabelled fallback (FR-1.7)

```
events:
  R = {id: 'aaaa…aaaa', kind: 1, tags: []}
  A = {id: 'bbbb…bbbb', kind: 1, tags: [['e','aaaa…aaaa']]}
expected:
  replyMap: {'aaaa…aaaa' → {'bbbb…bbbb'}}
  roots:    {}        # nothing tagged R as 'root', so roots is empty
  missing:  {}
```
*Asserts: a bare positional `e` tag becomes an implicit reply, but does NOT promote the parent to the roots set unless explicitly marked.*

### TV-4: Single-root fallback to reply (FR-1.8)

```
events:
  R = {id: 'aaaa…aaaa', kind: 1, tags: []}
  A = {id: 'bbbb…bbbb', kind: 1, tags: [['e','aaaa…aaaa','','root']]}
expected:
  roots:    {'aaaa…aaaa'}
  replyMap: {'aaaa…aaaa' → {'bbbb…bbbb'}}
  missing:  {}
```

### TV-5: Disambiguation, leaf wins (FR-2.4..2.6)

Chain `R → A → B → C`, where `C` mistags both `A` and `B` as positional `e` tags.

```
events:
  R = {id: 'r…', kind: 1, tags: []}
  A = {id: 'a…', kind: 1, tags: [['e','r…','','root']]}
  B = {id: 'b…', kind: 1, tags: [['e','r…','','root'], ['e','a…','','reply']]}
  C = {id: 'c…', kind: 1, tags: [['e','a…'], ['e','b…']]}    # ambiguous
expected:
  replyMap contains: 'b…' → {'c…'}     # B is the survivor; A is referenced by B
  replyMap contains: 'a…' → {'b…'}
  replyMap contains: 'r…' → {'a…'}
  roots:    {'r…'}
```

### TV-6: Disambiguation aborted on missing candidate (FR-2.3)

Same as TV-5 but corpus omits `B`. `C` lists `['e','a…']` and `['e','b…']`.

```
expected:
  replyMap: {'r…' → {'a…'}}            # C is unattached this pass
  missing:  {'b…'}                     # B was a candidate, now flagged for fetch
```
*After supplying B and re-running, the result must equal TV-5 (FR-6.2).*

### TV-7: Idempotency (FR-6.1)

Running `updateThreading` twice on the TV-2 corpus must produce identical state. (Implementations should add an assertion test that re-runs the function and deep-compares all three structures.)

### TV-8: Order independence (NFR-2, FR-6.2)

Running `updateThreading` on TV-5's corpus inserted in the order `[R, A, B, C]` must produce identical state to the same corpus inserted as `[C, B, A, R]`.

### TV-9: Invalid id rejection (FR-1.2)

```
events:
  X = {id: 'aaaa…aaaa', kind: 1,
       tags: [['e','tooshort'], ['e',''], ['e','xxxx…xxxx_not_64']]}
expected:
  All three tags ignored. classify(X) returns empty splits, thisIsRoot=true.
```

### TV-10: Mentions don't disqualify thisIsRoot (FR-1.9)

```
events:
  X = {id: 'aaaa…aaaa', kind: 1, tags: [['e','bbbb…bbbb','','mention']]}
expected:
  classify(X).thisIsRoot == true
  classify(X).mentions == {'bbbb…bbbb'}
  X does not appear in replyMap or roots.
```

## 8. Edge cases & real-world notes (informative)

- **Duplicate `e` tags**: Sets dedupe naturally. No special handling needed.
- **Self-reference**: A tag `['e', event.id, ...]` will currently be processed normally; if it ends up in `replies`, the event becomes a child of itself. Implementations MAY filter `tag[1] === event.id` defensively. The reference does not.
- **Mixed root/reply pointing at same id**: TV-4 shows this is fine; the same id ends up in both the roots set and the reply map.
- **`'mention'` markers on what is actually the parent**: Cannot be recovered; the algorithm treats mentions as not-a-parent. This is a known false negative.
- **Re-processing cost**: At ~10k events the full re-run is sub-second in V8 in a Web Worker. If you go higher, build an incremental variant that maintains a per-event "already classified, parent=X" cache and only re-runs `tagSplits` for changed events — but be careful: a previously-ambiguous event becomes resolvable when its candidate parents arrive, so you cannot skip it unconditionally.

## 9. Out of scope

- **Fetching missing events.** `missingEvents` is the input to a fetcher; the fetcher itself (which relays to ask, retry policy, dedupe) is out of scope.
- **Read-state / "already viewed" tracking.** humble.horse uses a kind-18100 bloom filter for this; that's a separate concern.
- **Feed ordering.** Sorting roots by reply count, recency, or relevance is the consumer's job.
- **Validation of signatures, kinds other than 1, deletions (kind 5), reactions (kind 7).** These are filtered before reaching this algorithm.
- **NIP-22 comment threading on non-kind-1 events.** Different tag conventions; not covered here.

## 10. Traceability matrix

| Requirement | Spec §  | Pseudocode line       | Reference impl                           | Test vector(s)        |
|---          |---      |---                    |---                                       |---                    |
| FR-1.1      | §3, §5  | `for tag in event.tags…` | `classify`: `if (tag[0] !== 'e')`     | TV-2, TV-9            |
| FR-1.2      | §3, §5  | `len(tag[1]) != 64`   | `classify`: `HEX64.test`                 | TV-9                  |
| FR-1.3–1.6  | §3, §5  | the `if/elif` ladder  | `classify` ladder                        | TV-2, TV-3, TV-10     |
| FR-1.5      | §3      | `'://' in tag[-1]`    | `classify`: `tag[len-1].includes('://')` | (legacy fixtures)     |
| FR-1.7      | §3, §5  | `replies.size==0 && unlabelled.size==1` | `classify` post-loop block | TV-3                  |
| FR-1.8      | §3, §5  | `replies.size==0 && roots.size==1`      | `classify` post-loop block | TV-4                  |
| FR-1.9      | §3      | `thisIsRoot`          | `classify`: `splits.thisIsRoot=false` toggles | TV-10            |
| FR-2.1      | §3, §5  | `ambiguous = …`       | `updateThreading`: `const ambiguous`     | TV-5, TV-6            |
| FR-2.2      | §3, §5  | `candidates = …`      | `updateThreading`: `new Set([...])`      | TV-5                  |
| FR-2.3      | §3, §5  | `if not all present: missing.add` | `updateThreading`: `else missing.add` | TV-6              |
| FR-2.4      | §3, §5  | `referenced |= classify(c).all` | `updateThreading`: nested classify loop | TV-5            |
| FR-2.5–2.6  | §3, §5  | `survivors = candidates - referenced` | `updateThreading`: survivors block | TV-5             |
| FR-2.7      | §3      | implicit no-op        | implicit no-op                           | TV-6 (interim state) |
| FR-3.1      | §3, §5  | `for r in splits.roots: roots.add(r)` | `updateThreading`: roots loop | TV-2              |
| FR-3.2      | §3      | (negative)            | (negative)                               | TV-1, TV-3            |
| FR-4.1      | §3, §5  | `if len(splits.replies)==1` | `updateThreading`: final if         | TV-2..TV-5            |
| FR-4.2      | §3, §5  | `replyMap[parent].add(id)` | `updateThreading`: `kids.add(id)`   | TV-2..TV-5            |
| FR-5.1      | §3, §5  | `missing.add(r)` etc. | `updateThreading`: both add sites        | TV-6                  |
| FR-5.2      | §3, §5  | `missing.discard(id)` | `updateThreading`: `state.missing.delete(id)` | TV-6 (after fetch) |
| FR-6.1      | §3      | full-corpus loop      | `updateThreading` re-iterates corpus     | TV-7                  |
| FR-6.2      | §3      | order-independent     | (implicit; tested by TV-8)               | TV-8                  |
| NFR-1       | §4      | n/a                   | `O(E·T) + O(C·T_c)` per ambig event      | n/a                   |
| NFR-2       | §4      | n/a                   | (implicit; tested by TV-8)               | TV-8                  |
| NFR-3       | §4      | n/a                   | run on background thread                 | n/a                   |
| NFR-4       | §4      | n/a                   | `sig?` optional in `NostrEvent`          | n/a                   |
