import { bech32 } from '@scure/base';

let _fetch = fetch;
const utf8Decoder = new TextDecoder("utf-8");


export function useFetchImplementation(fetchImplementation) {
  _fetch = fetchImplementation;
}

export async function getZapEndpoint(metadata: { content?: string}): Promise<string | null> {
  try {
    let lnurl = '';
    const { lud06, lud16 } = JSON.parse(metadata.content || '{}'); // Add fallback for missing content

    if (lud06) {
      const { words } = bech32.decode(lud06, 1000);
      const data = bech32.fromWords(words);
      lnurl = utf8Decoder.decode(data);
    } else if (lud16) {
      if (!lud16.includes('@')) {
        throw new Error('Invalid LUD16 format');
    }
      // Extract domain and name from the LUD16 address
      const [name, domain] = lud16.split('@');
      // Build the LNURL service URL dynamically based on the domain
      lnurl = new URL(`/.well-known/lnurlp/${name}`, `https://${domain}`).toString();
    } else {
      return null; // Handle missing LNURL case
    }


    const res = await _fetch(lnurl);

    if (!res.ok) { // Handle non-200 response codes
      console.error(`Error fetching LNURL: ${res.statusText}`);
      return null;
    }

    const body = await res.json();

    if (body.allowsNostr && body.nostrPubkey) {
      return body.callback;
    }
  } catch (err) {
    console.error("Error in getZapEndpoint:", err);
  }

  return null;
}


export function makeZapRequest({
  profile,
  event,
  amount,
  relays = [],
  comment = ''
}: {
  profile: string;
  event?: string;
  amount: number;
  relays?: string[];
  comment?: string;
}): {
  created_at: number;
  content: string;
  tags: string[][]
} {
  if (!amount) throw new Error('Amount not given');
  if (amount <= 0) throw new Error('Amount must be a positive number');
  if (!profile) throw new Error('Profile not given');

  const zapRequest = {
    created_at: Math.round(Date.now() / 1000),
    content: comment,
    tags: [
      ['amount', amount.toString()],
      ['p', profile], // Include profile pubkey
    ] as string[][] // Explicitly typing the array as string[][]
  };

  if (event) {
    zapRequest.tags.push(['e', event]);
  }

  if (relays.length > 0) {
    for (const relay of relays) {
      zapRequest.tags.push(['relays', relay]);
  }  }

  return zapRequest;
}
