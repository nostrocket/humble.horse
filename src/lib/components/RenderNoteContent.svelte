<script lang="ts">
	import DOMPurify from 'dompurify';
	export let inputString = '';

	// Format the input string: replaces line breaks with <br> tags and image URLs with <img> tags
	function formatInput(input: string) {
		//ethically cleanse the input
		input = DOMPurify.sanitize(input);

		// replace newline characters with <br> tags
		let formattedInput = input.replace(/(\r\n|\n|\r)/gm, '<br>');

		// regex to find URLs
		const urlRegex = /https?:\/\/\S+\.(jpg|jpeg|png|gif|svg)\b/g;

		// Replace image URLs with <img> tags
		formattedInput = formattedInput.replace(urlRegex, (url) => {
			return `<img src="${url}" alt="Image" style="max-width: 98%; height: auto;" class="m-2 rounded">`;
		});

        const nostr = /nostr:\S+/g;

        

		return formattedInput;
	}
</script>

<div>
	{@html formatInput(inputString)}
</div>
