<script lang="ts">
	import DOMPurify from 'dompurify';
	export let inputString = '';

	function extractYouTubeVideoID(url: string) {
		const regex =
			/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
		const match = url.match(regex);
		if (match && match[1]) {
			return match[1];
		}
		return undefined;
	}

	// Format the input string: replaces line breaks with <br> tags and image URLs with <img> tags
	function formatInput(input: string) {
		//ethically cleanse the input
		input = DOMPurify.sanitize(input);

		// replace newline characters with <br> tags
		let formattedInput = input.replace(/(\r\n|\n|\r)/gm, ' <br /> ');

		const nostr = /nostr:\S+/g;

		formattedInput = formattedInput.replace(nostr, (s) => {
			s = s.replace('nostr:', '');
			return ` <a class="underline decoration-solid text-sky-500" href="https://njump.me/${s}">njump</a> `; //todo: render mentioned notes inline, render usernames for npubs,
		});

		// regex to find video URLs
		const vurlRegex = /https?:\/\/\S+\.(mp4)\b/g;

		formattedInput = formattedInput.replace(vurlRegex, (url) => {
			return `<video src="${url}" style="max-width: 98%; height: auto;" class="m-2 rounded">`;
		});

		// regex to find image URLs
		const urlRegex = /https?:\/\/\S+\.(jpg|jpeg|png|gif|svg)\b/g;

		// Replace image URLs with <img> tags
		formattedInput = formattedInput.replace(urlRegex, (url) => {
			return `<img src="${url}" alt="${url}" style="max-width: 98%; height: auto;" class="m-2 rounded">`;
		});

		const ytRegex =
			/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

		formattedInput = formattedInput.replace(ytRegex, (url) => {
			let ytID = extractYouTubeVideoID(url);
			if (ytID) {
				return `<iframe id="ytplayer" width="auto" height="300"
  src="https://www.youtube.com/embed/${ytID}?autoplay=0"
  frameborder="0"></iframe>`;
			}
			return '<br /><p>FAILED TO GET YT VIDEO</p><br />';
		});

		return formattedInput;
	}
</script>

<div>
	{@html formatInput(inputString)}
</div>
