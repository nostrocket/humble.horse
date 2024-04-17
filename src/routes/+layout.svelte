<script lang="ts">
	import { Init } from '@/workers/firehose_master';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';
	import '../app.css';

	onMount(() => {
		//Init();
	});
</script>
<ModeWatcher />
<slot />
