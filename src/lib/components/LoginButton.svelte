<script lang="ts">
	import { currentPubkey } from "@/stores/user";
	import { NDKNip07Signer } from "@nostr-dev-kit/ndk";
	import { Person } from "radix-icons-svelte";
	import { onMount } from "svelte";
	import Button from "./Button.svelte";
	import { KeySolid } from "svelte-awesome-icons";

    onMount(() => {
        if (localStorage.getItem("signed-in")) {
            nip07();
        }
    })

    async function nip07() {
        document.body.appendChild(document.createElement('script')).src = 'https://unpkg.com/window.nostr.js/dist/window.nostr.js';

        try {
            const signer = new NDKNip07Signer();
            const user = await signer.blockUntilReady();

            if (user) {
                currentPubkey.update(existing=>{
                    existing = user.pubkey
                    return existing
                })
                // $ndk.signer = signer;
                // $ndk = $ndk
                localStorage.setItem("signed-in", "true");
            }
        } catch (e) {
            alert(e);
        }
    }
</script>

<Button onClick={nip07}>
    <KeySolid />
</Button>