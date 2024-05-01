<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.css';
	import { Init } from '@/snort_workers/main';
	import { init } from '@/views/messages/snort';
	import { connect } from '@/ndk/ndk';

	onMount(() => {
		console.log("layout mounted")
		Init();
		init();
		connect()
	});
</script>
<ModeWatcher />
<slot />
