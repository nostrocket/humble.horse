# humble.horse

A Nostr client. SvelteKit SPA, deployed to GitHub Pages.

# Rules for pull requests

1. A pull request MUST contain only ONE single commit.
2. The commit message MUST state the problem that this commit / pull request is solving.

# Development setup

```sh
npm install
npm run dev      # dev server
npm run check    # type check (svelte-check)
npm run lint     # eslint
npm run test     # integration (playwright) + unit (vitest)
npm run build    # production build
```
