<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.css';
	import { Init } from '@/snort_workers/main';
	import { init } from '@/views/messages/snort';

	onMount(() => {
		console.log("layout mounted")
		Init();
		init()
	});
</script>
<ModeWatcher />
<slot />
