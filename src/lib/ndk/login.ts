import { NDKNip46Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { nip19 } from 'nostr-tools';
import NDK from '@nostr-dev-kit/ndk';

const STORAGE_KEYS = {
	SIGNED_IN: 'signed-in',
	NSEC: 'signed-in-nsec',
	NSECBUNKER_KEY: 'signed-in-nsecbunker-key',
	NSECBUNKER_TOKEN: 'signed-in-nsecbunker-token'
};

export function loginWithNsec(nsec: string): NDKPrivateKeySigner | Error {
	try {
		const { type, data } = nip19.decode(nsec);
		if (type !== 'nsec' || typeof data !== 'string') {
			throw new Error('Invalid nsec format');
		}
		return new NDKPrivateKeySigner(data);
	} catch (e) {
		console.error('Error logging in with nsec:', e);
		return e instanceof Error ? e : new Error(String(e));
	}
}

export async function connectToBunker(nip05: string): Promise<NDKNip46Signer> {
	const bunkerNDK = new NDK();
	const existingPrivateKey = localStorage.getItem(STORAGE_KEYS.NSECBUNKER_KEY);
	const localSigner = existingPrivateKey
		? new NDKPrivateKeySigner(existingPrivateKey)
		: NDKPrivateKeySigner.generate();

	const remoteSigner = new NDKNip46Signer(bunkerNDK, nip05, localSigner);
	remoteSigner.on('authUrl', (url: string) => {
		window.open(url, 'nsecbunker', 'width=600,height=600');
	});

	await remoteSigner.blockUntilReady();

	if (!existingPrivateKey) {
		localStorage.setItem(STORAGE_KEYS.NSECBUNKER_KEY, localSigner.privateKey!);
	}
	localStorage.setItem(STORAGE_KEYS.SIGNED_IN, 'nip46');
	localStorage.setItem(STORAGE_KEYS.NSECBUNKER_TOKEN, nip05);

	return remoteSigner;
}

export function purgeSignedInStorage(): void {
	Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
