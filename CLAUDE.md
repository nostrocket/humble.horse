# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — SvelteKit dev server (binds `--host` so it's reachable on LAN).
- `npm run build` / `npm run preview` — production build (adapter-static) and local preview on port 4173.
- `npm run check` — `svelte-kit sync` + `svelte-check`. This is the type check; `tsc` alone won't work because SvelteKit generates ambient types during `sync`.
- `npm run lint` — ESLint over the repo. `npm run format` — Prettier write.
- `npm run test` — runs integration then unit tests. Split them with:
  - `npm run test:unit` → Vitest. Single file: `npx vitest run src/path/to/file.test.ts`. Watch a single file: `npx vitest src/path/to/file.test.ts`.
  - `npm run test:integration` → Playwright. The config runs `npm run build && npm run preview` as its webServer, so integration tests need a buildable tree. Single test: `npx playwright test tests/foo.test.ts`.

Pre-commit runs `lint-staged` (Prettier write + check) via Husky. CI (`.github/workflows/main.yml`) builds and deploys to GitHub Pages on push to `master`.

## PR conventions (from README.md — enforced by reviewers)

1. One commit per PR. Squash locally before opening.
2. The commit/PR title must state the **problem** being solved, phrased as a problem, not a solution. Existing history uses `problem: <what's broken>` (lowercase). Examples: `problem: can't zap notes`, `problem: menu buttons don't highlight`.

## Architecture

SvelteKit SPA (adapter-static, prerendered, GitHub Pages) that is a Nostr client. The non-obvious thing is that **two Nostr stacks run side-by-side**, each owning a different half of the app:

- **NDK** (`@nostr-dev-kit/ndk`, wrapped in `src/lib/ndk/ndk.ts`) — user identity, login (NIP-07 extension / NIP-46 bunker / nsec — see `src/lib/ndk/login.ts`), publishing events, and anything user-authored. The `currentUser` and `ndk` writable stores are exported from `ndk.ts`.
- **@snort/system** — read-side subscriptions and aggregation. There are two snort instances:
  1. A `NostrSystem` in `src/lib/views/messages/snort.ts` used directly by the Messages view for thread-scoped queries (e.g. "fetch replies to this event").
  2. A second `NostrSystem` that lives entirely inside a **Web Worker** (`src/lib/snort_workers/master_worker.ts`, imported via Vite's `?worker` suffix from `main.ts`). This is the main feed engine.

Both stacks are initialized from `src/routes/+layout.svelte` on mount: `Init()` spins up the worker, `init()` boots the main-thread snort system, `connect()` connects NDK. When `currentUser` changes, `UpdatePubkey` terminates and re-creates the worker so its state is pinned to one pubkey.

### The worker loop (the core of the app)

`master_worker.ts` owns a `WorkerData` (authoritative) and publishes a flattened, postMessage-safe `FrontendData` snapshot (see `snort_workers/types.ts`) to `FrontendDataStore` in `main.ts`. Each pushed snapshot recomputes **two root orderings**:

- `rootsByReplies` — sorted by number of descendants we've seen.
- `rootsByKeyword` — sorted by RAKE keyword-hit score against the user's personal keyword profile.

The Messages view interleaves these two orderings as the feed. Roots that pass the user's bloom filter test are hidden (treated as "already read").

Event kinds the worker cares about:

- `1` (text note), `7` (reaction) — streamed live for follows via a "sub-to-follows" `RequestBuilder`.
- `3` (contact list) — the user's follows are derived from their latest kind-3. Drives the live sub.
- `10002` (relay list) — tracked as a replaceable.
- `18100` — **app-specific**: the user's personal bloom filter of viewed event ids, stored as `['bloom', '32', JSON-encoded-buckets]`. This is how "unread" state survives across devices. The "Publish bloom filter" button in the right sidebar of `Messages.svelte` writes one.

Replaceable events (3 / 10002 / 18100) are kept as latest-per-(pubkey, kind) in `WorkerData.latestReplaceable`.

### Reply-tree construction (`snort_workers/utils.ts::tagSplits` + `updateRepliesInPlace`)

NIP-10 tags in the wild are messy. `tagSplits` classifies each `e` tag into `roots` / `replies` / `mentions` / `unlabelled` / `unknown`, then `updateRepliesInPlace` attempts to disambiguate when an event has multiple unlabelled `e` tags by cross-referencing which tagged events themselves reference which others. Missing ancestor events are added to `WorkerData.missingEvents` for later fetching. Don't "clean this up" naively — the heuristics handle real-world client bugs.

### RAKE keyword scoring (`src/lib/rake/rake.ts`)

Rapid Automatic Keyword Extraction with Porter stemming and a large stopword list. When we see an event authored by `ourPubkey`, its content is RAKE-processed and the resulting keywords (with frequencies) accumulate into the user's personal keyword profile. That profile is what `rootsByKeyword` is scored against — it's an implicit "what this user writes about" filter.

### Threading / view state (`src/lib/stores/shortlist.ts`)

- `threadParentIDChain` is a stack of event ids; `'root'` at the bottom means the top-level feed.
- `threadParentID` is the top of the stack. `Messages.svelte` keys the current view on this.
- `stableShortList` is the currently-rendered set of 6 events at root level, kept stable so the list doesn't jump as the worker pushes new data. At root, viewed events (in `viewed` store) are swapped out; inside a thread, everything is shown sorted by `created_at`.

### UI

- Tailwind + daisyUI + **shadcn-svelte** (bits-ui under the hood; primitives live in `src/lib/components/ui/`). `components.json` configures the shadcn-svelte CLI.
- `ChatLayout.svelte` is the shared shell: left icon sidebar (`Home`, `To-Do`, `Help`, `Settings`, `Merits`, `GitHub`, `Theme`, `Tiks`, `Marcus`), main scroll area (`<slot />`), optional input row (`slot="input"`), optional right-hand panel (`slot="right"`) shown only on `lg:`.
- Dark mode via `mode-watcher`. Toasts via `svelte-sonner`. Rich-text input uses Quill (`MessageInput.svelte`).

### Routes

`/` → `Messages.svelte` (main feed). `/marcus` (personal meditations pinned by the Marcus button), `/merits`, `/tiks`, `/todo`, `/help` each render through `ChatLayout`. `/e` is a throwaway chat-UI demo page — don't mistake it for production.

## Path aliases (svelte.config.js)

Use these instead of long relative paths:

- `@/*` → `src/lib/*`
- `@components/*` → `src/lib/components/*`
- `$stores` → `src/lib/stores`

Plus SvelteKit's built-ins: `$app/navigation`, `$app/paths`, `$app/stores`, `$lib`.
