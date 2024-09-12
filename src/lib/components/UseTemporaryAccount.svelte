<script lang="ts">
	import { ndk } from '$lib/ndk/ndk';
	import { Button } from '@/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
	import { nip19 } from 'nostr-tools';
	import CopyButton from './CopyButton.svelte';
	import { Input } from '$lib/components/ui/input';
	import { currentPubkey } from '$lib/stores/user';

	let temporaryAccount: NDKPrivateKeySigner;
	let nsec: string;

	async function createTemporaryAccount() {
		temporaryAccount = NDKPrivateKeySigner.generate();
		nsec = nip19.nsecEncode(temporaryAccount.privateKey!);
		console.log(nsec);
	}

	async function useTemporaryAccount() {
		$currentPubkey = (await temporaryAccount.user()).pubkey;
		$ndk.signer = temporaryAccount;
		localStorage.setItem('signed-in', 'nsec');
		localStorage.setItem('signed-in-nsec', nsec);
	}
</script>

<Dialog.Root>
	<Dialog.Trigger class="w-full">
		<Button on:click={createTemporaryAccount} class="w-full">Use Temporary Account</Button>
	</Dialog.Trigger>
	<Dialog.Content>
		<div class="space-y-6 py-4">
			<p class="mb-4">
				Your temporary account has been created. Please save the following private key (nsec) for
				future use:
			</p>
			<div class="mb-4 flex gap-2">
				<Input bind:value={nsec} readonly />
				<CopyButton text={nsec} />
			</div>
			<p class="mb-6 text-sm text-gray-600">
				Warning: Please store this private key in a secure location. If lost, you will not be able
				to access this account again.
			</p>
			<Button on:click={useTemporaryAccount} class="w-full">
				I've Safely Stored the Private Key
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
