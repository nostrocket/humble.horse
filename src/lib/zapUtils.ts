import { bech32 } from '@scure/base';

let _fetch = fetch;
const utf8Decoder = new TextDecoder("utf-8");


export function useFetchImplementation(fetchImplementation) {
  _fetch = fetchImplementation;
}

export async function getZapEndpoint(metadata) {
  try {
    let lnurl = '';
    let { lud06, lud16 } = JSON.parse(metadata.content || '{}'); // Add fallback for missing content
    console.log("Parsed metadata:", { lud06, lud16 });

    if (lud06) {
      let { words } = bech32.decode(lud06, 1000);
      let data = bech32.fromWords(words);
      lnurl = utf8Decoder.decode(data);
    } else if (lud16) {
      // Extract domain and name from the LUD16 address
      let [name, domain] = lud16.split('@');
      // Build the LNURL service URL dynamically based on the domain
      lnurl = new URL(`/.well-known/lnurlp/${name}`, `https://${domain}`).toString();
    } else {
      return null; // Handle missing LNURL case
    }

    console.log("LNURL:", lnurl);

    let res = await _fetch(lnurl);

    if (!res.ok) { // Handle non-200 response codes
      console.error(`Error fetching LNURL: ${res.statusText}`);
      return null;
    }

    let body = await res.json();
    console.log("LNURL Response Body:", body);

    if (body.allowsNostr && body.nostrPubkey) {
      return body.callback;
    }
  } catch (err) {
    console.error("Error in getZapEndpoint:", err);
  }

  return null;
}



export function makeZapRequest({ profile, event, amount, relays = [], comment = '' }) {
  if (!amount) throw new Error('Amount not given');
  if (!profile) throw new Error('Profile not given');

  let zapRequest = {
    created_at: Math.round(Date.now() / 1000),
    content: comment,
    tags: [
      ['amount', amount.toString()],
      ['p', profile], // Include profile pubkey
    ]
  };

  if (event) {
    zapRequest.tags.push(['e', event]);
  }

  if (relays.length > 0) {
    zapRequest.tags.push(['relays', ...relays]); // Add relay list if available
  }

  console.log("Zap Request:", zapRequest);

  return zapRequest;
}
