<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.css';
	import { Init, UpdatePubkey } from '@/snort_workers/main';
	import { init } from '@/views/messages/snort';
	import { connect, currentUser } from '@/ndk/ndk';
	import { stableShortList } from '@/stores/shortlist';
	import { Toaster } from 'svelte-sonner';

	currentUser.subscribe((c) => {
		if (c && c.pubkey) {
			stableShortList.set([]);
			UpdatePubkey(c.pubkey);
		}
	});

	onMount(() => {
		console.log('layout mounted');
		Init();
		init();
		connect();
	});
</script>

<ModeWatcher />
<Toaster />
<slot />
