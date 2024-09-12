<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '@components/ui/input';
	import { Button } from '@components/ui/button';
	import { ndk } from '$lib/ndk/ndk';
	import { connectToBunker } from '$lib/ndk/login';
	import { currentPubkey } from '$lib/stores/user';

	$: isLoading = false;
	let nip05 = '';

	async function handleLogin() {
		isLoading = true;
		try {
			const signer = await connectToBunker(nip05);
			$currentPubkey = (await signer.user()).pubkey;
			$ndk.signer = signer;
		} catch (error) {
			console.error('Login failed:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

<Dialog.Root>
	<Dialog.Trigger class="w-full">
		<Button class="w-full">Nostr Address</Button>
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Login with Nostr Address</Dialog.Title>
		</Dialog.Header>
		<form on:submit|preventDefault={handleLogin}>
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-4 items-center gap-4">
					<label for="bunker-id" class="text-right"> Nostr Address </label>
					<Input id="bunker-id" placeholder="user@provider" bind:value={nip05} class="col-span-3" />
				</div>
				<p class="col-span-4 text-center text-sm text-gray-600">
					Don't have a Nostr address? You can sign up for one at
					<a
						href="https://nsec.app"
						target="_blank"
						rel="noopener noreferrer"
						class="text-blue-500 hover:underline">nsec.app</a
					>.
				</p>
			</div>
			<Dialog.Footer>
				<Button type="submit" disabled={isLoading}>
					{#if isLoading}
						Connecting to bunker...
					{:else}
						Connect
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
