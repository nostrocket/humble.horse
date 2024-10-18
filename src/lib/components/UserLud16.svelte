<script lang="ts">
  import { FrontendDataStore } from '@/snort_workers/main';
  import { kind0 } from '@/stores/user';
  import { System } from '@/views/messages/snort';
  import { RequestBuilder, type QueryLike } from '@snort/system';
  import { nip19 } from 'nostr-tools';
  import { onDestroy, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { getZapEndpoint, makeZapRequest } from '@/zapUtils';

  export let pubkey: string;

  let q: QueryLike;
  const profileLud16 = writable('');
  const customZapAmountSats = writable(0); // Store for zap amount in sats
  const customZapComment = writable(''); // Store for zap comment
  const showModal = writable(false); // Store for modal visibility


  onMount(() => {
    if (pubkey && pubkey.length == 64) {
      if (!$kind0.get(pubkey)) {
        const rb = new RequestBuilder(pubkey);
        rb.withFilter().authors([pubkey]).kinds([0]);
        rb.withOptions({ leaveOpen: false });
        q = System.Query(rb);
        q.on('event', (evs) => {
          if (evs.length > 0) {
            kind0.update((existing) => {
              for (let e of evs) {
                let _existing = existing.get(e.pubkey);
                if (!_existing || (_existing && _existing.created_at <= e.created_at)) {
                  existing.set(e.pubkey, e);
                }
              }
              return existing;
            });
          }
        });
      }
    }


    showModal.set(true);
  });

  // Cleanup on destroy
  onDestroy(() => {
    if (q) {
      q.cancel();
    }
  });


  $: {
    const content = $kind0.get(pubkey)?.content;
    let lud16 = '';
    if (content) {
      try {
        const json = JSON.parse(content);
        if (json.lud16 && json.lud16.length > 6) {
          lud16 = json.lud16;
        }
      } catch {
        console.log('Error parsing content');
      }
    }
    profileLud16.set(lud16);
    console.log('LUD-16:', lud16);
  }


  const closeModal = () => showModal.set(false);


  async function handleZap() {
    const lud16 = $profileLud16; // Use the fetched LUD16 from profileLud16 store
    const comment = $customZapComment;


    const metadata = {
      content: JSON.stringify({ lud16, comment })
    };

    const callback = await getZapEndpoint(metadata); // You should define this function

    if (callback) {
      const amountToSend = $customZapAmountSats * 1000; // Convert sats to millisats (1 sat = 1000 millisats)

      if (!amountToSend) {
        console.error('Please enter a zap amount.');
        alert('Please enter a zap amount.');
        return;
      }

      const zapRequest = makeZapRequest({
        profile: lud16,
        event: null,
        amount: amountToSend,
        comment: comment,
        relays: ['wss://relay.damus.io']
      });

      const response = await fetch(`${callback}?amount=${amountToSend}`);
      const { pr: invoice } = await response.json();

      console.log('Invoice:', invoice);

      try {
        if (window.webln) {
          await window.webln.enable();
          await window.webln.sendPayment(invoice);
          console.log('Payment sent successfully via WebLN!');
        } else {
          console.error('WebLN not available.');
          alert('WebLN not available.');
        }
      } catch (err) {
        console.error('WebLN error:', err);
        alert('Failed to send payment via WebLN.');
      }
    } else {
      console.error('Failed to get zap endpoint.');
    }

    closeModal();
  }
</script>



  {#if $showModal}
    <div class="modal">
      <div class="modal-content">
        <h3>Send Zap</h3>


        <label for="comment">Comment:</label>
        <input
          type="text"
          id="comment"
          bind:value={$customZapComment}
          placeholder="Enter zap comment"
        />


        <label for="amount">Amount (in sats):</label>
        <input
          type="number"
          id="amount"
          bind:value={$customZapAmountSats}
          placeholder="Enter amount in sats"
        />


        <button on:click={handleZap}>Send Zap</button>
        <button on:click={closeModal}>Cancel</button>
      </div>
    </div>
  {/if}


  <style>
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      overflow: hidden;
      backdrop-filter: blur(8px);
      transition: opacity 0.3s ease;
    }

    .modal-content {
      background-color: #fff;
      padding: 25px;
      border-radius: 12px;
      width: 320px;
      text-align: center;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      transform: scale(0.9);
      animation: showModal 0.3s ease forwards;
    }

    .modal h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      margin-bottom: 15px;
      color: #333;
    }

    .modal label {
      display: block;
      margin-bottom: 5px;
      font-size: 0.9rem;
      color: #666;
      text-align: left;
    }

    .modal input {
      width: 100%;
      padding: 10px;
      margin-bottom: 15px;
      border-radius: 8px;
      border: 1px solid #ddd;
      font-size: 1rem;
      font-family: 'Poppins', sans-serif;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .modal input:focus {
      border-color: #007bff;
    }

    .modal button {
      width: 100%;
      padding: 10px;
      margin-top: 10px;
      border-radius: 8px;
      border: none;
      background-color: #007bff;
      color: white;
      font-size: 1rem;
      font-family: 'Poppins', sans-serif;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.1s ease;
    }

    .modal button:hover {
      background-color: #0056b3;
      transform: translateY(-2px);
    }

    .modal button:active {
      transform: translateY(0); 
    }

    @keyframes showModal {
      0% {
        opacity: 0;
        transform: scale(0.9);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
  </style>
