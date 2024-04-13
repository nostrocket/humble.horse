<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import LoginButton from '@/components/LoginButton.svelte';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Init } from '@/workers/firehose_master';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import { Home, QuestionMark } from 'radix-icons-svelte';
	import { onMount } from 'svelte';
	import { ArrowTurnUpSolid } from 'svelte-awesome-icons';
	import Moon from 'svelte-radix/Moon.svelte';
	import Sun from 'svelte-radix/Sun.svelte';
	import '../app.css';
	import { page } from '$app/stores';

	onMount(() => {
		Init();
	});
</script>

<ModeWatcher />
<slot />
