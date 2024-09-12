<script lang="ts">
	import { ndk } from '$lib/ndk/ndk';
	import { Button } from '@/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Avatar } from '@nostr-dev-kit/ndk-svelte-components';
	import UseTemporaryAccount from '@/components/UseTemporaryAccount.svelte';
	import ConnectToBunker from '@/components/ConnectToBunker.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { NDKNip07Signer } from '@nostr-dev-kit/ndk';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { connectToBunker, loginWithNsec, purgeSignedInStorage } from './login';
	import { currentPubkey } from '$lib/stores/user';
	import { UserAstronautSolid } from 'svelte-awesome-icons';

	$: isLoading = true;

	onMount(async () => {
		const signedIn = localStorage.getItem('signed-in');
		if (signedIn) {
			try {
				if (signedIn === 'nip07') {
					await loginByExtension();
				} else if (signedIn === 'nsec') {
					const nsec = localStorage.getItem('signed-in-nsec');
					if (nsec) {
						const signer = loginWithNsec(nsec);
						if (signer instanceof Error) {
							purgeSignedInStorage();
						} else {
							$currentPubkey = (await signer.user()).pubkey;
							$ndk.signer = signer;
						}
					} else {
						purgeSignedInStorage();
					}
				} else if (signedIn === 'nip46') {
					const token = localStorage.getItem('signed-in-nsecbunker-token');
					if (token) {
						const signer = await connectToBunker(token);
						$currentPubkey = (await signer.user()).pubkey;
						$ndk.signer = signer;
					} else {
						purgeSignedInStorage();
					}
				} else {
					purgeSignedInStorage();
				}
			} catch (error) {
				console.error('Error during auto-login:', error);
				purgeSignedInStorage();
			}
		}
		isLoading = false;
	});

	async function loginByExtension() {
		try {
			const signer = new NDKNip07Signer();
			const user = await signer.blockUntilReady();

			if (user) {
				$currentPubkey = user.pubkey;
				$ndk.signer = signer;
				localStorage.setItem('signed-in', 'nip07');
			}
		} catch (e) {
			alert(e);
		}
	}

	async function logout() {
		purgeSignedInStorage();
		$ndk.signer = undefined;
		$currentPubkey = '';
		await goto(`${base}/`);
	}
</script>

{#if !$ndk.signer}
	<Dialog.Root>
		<Dialog.Trigger class="shrink-0">
			<div class="flex items-center justify-start p-2.5">
				<UserAstronautSolid class=" fill-violet-700 dark:fill-orange-500" />
			</div>
		</Dialog.Trigger>
		<Dialog.Content class="flex flex-col gap-4 p-4">
			<Dialog.Header>
				<Dialog.Title>Log In</Dialog.Title>
			</Dialog.Header>
			<Button on:click={loginByExtension} class="w-full">Browser Extension</Button>
			<div class="w-full space-y-2">
				<UseTemporaryAccount />
				<ConnectToBunker />
			</div>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild let:builder>
			<div class="flex items-center justify-start p-1.5">
				<Button builders={[builder]} variant="secondary" size="icon" class="shrink-0 rounded-full">
					<Avatar ndk={$ndk} pubkey={$currentPubkey} class="flex-none rounded-full object-cover" />
					<span class="sr-only">Toggle user menu</span>
				</Button>
			</div>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Label>My Account</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Item>Settings</DropdownMenu.Item>
			<DropdownMenu.Item>Support</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item on:click={logout}>Logout</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
