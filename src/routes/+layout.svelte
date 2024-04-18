<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.css';
	import { Init } from '@/snort_workers/main';

	onMount(() => {
		console.log("layout mounted")
		Init();
	});
</script>
<ModeWatcher />
<slot />
