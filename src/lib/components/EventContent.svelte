<script lang="ts">
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
    import markdownit from 'markdown-it'
    import markdownitMathjax3 from 'markdown-it-mathjax3'

    const md = markdownit()
        .use(markdownitMathjax3)

    export let event: NDKEvent;
</script>

<div class="prose flex flex-col items-start gap-4 text-zinc-600 dark:text-zinc-400 font-serif text-lg leading-9">
    {@html md.render(event.content)}
</div>
