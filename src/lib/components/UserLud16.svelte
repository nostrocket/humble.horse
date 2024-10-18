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
  const customZapAmountSats = writable(0);
  const customZapComment = writable('');
  const showModal = writable(false);


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
      } catch (error) {
        console.log('Error parsing content', error);
      }
    }
    profileLud16.set(lud16);
  }


  const closeModal = () => showModal.set(false);


  async function handleZap() {
  const lud16 = $profileLud16;
  const comment = $customZapComment;

  const metadata = {
    content: JSON.stringify({ lud16, comment })
  };

  try {
    const callback = await getZapEndpoint(metadata);

    if (callback) {
      const amountToSend = $customZapAmountSats * 1000;

      if (!amountToSend) {
        console.error('No zap amount entered.');
        alert('Please enter a valid zap amount.');
        return;
      }

      // Fetch the invoice using the callback URL
      const response = await fetch(`${callback}?amount=${amountToSend}`);
      if (!response.ok) {
        console.error('Failed to fetch invoice:', response.statusText);
        alert('Error fetching invoice. Please try again later.');
        return;
      }

      const { pr: invoice } = await response.json();
      console.log('Invoice received:', invoice);

      try {
        if (window.webln) {
          await window.webln.enable();
          await window.webln.sendPayment(invoice);
          console.log('Payment sent successfully via WebLN!');
          alert('Payment sent successfully!');
        } else {
          console.error('WebLN not available.');
          alert('WebLN is not available. Please use a WebLN-compatible browser.');
        }
      } catch (err) {
        console.error('WebLN payment error:', err);
        alert(`Failed to send payment via WebLN. Error: ${err.message}`);
      }
    } else {
      console.error('Failed to retrieve zap endpoint.');
      alert('Unable to retrieve zap endpoint. Please try again later.');
    }
  } catch (err) {
    console.error('Error in zap process:', err);
    alert(`An error occurred while processing the zap. Error: ${err.message}`);
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
        <button class="cancel" on:click={closeModal}>Cancel</button>
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

    .modal button.cancel {
    background-color: #ccc;
    color: #333;
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
