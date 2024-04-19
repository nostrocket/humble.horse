<script lang="ts">
	import DOMPurify from 'dompurify';
	export let inputString = '';

	// Format the input string: replaces line breaks with <br> tags and image URLs with <img> tags
	function formatInput(input: string) {
		//ethically cleanse the input
		input = DOMPurify.sanitize(input);

		// replace newline characters with <br> tags
		let formattedInput = input.replace(/(\r\n|\n|\r)/gm, '<br>');

		const nostr = /nostr:\S+/g;

		formattedInput = formattedInput.replace(nostr, (s)=>{
			s = s.replace("nostr:", "");
			return ` <a href="https://njump.me/${s}">njump</a> ` //todo: render mentioned notes inline, render usernames for npubs, 
		});

		// regex to find URLs
		const urlRegex = /https?:\/\/\S+\.(jpg|jpeg|png|gif|svg)\b/g;

		// Replace image URLs with <img> tags
		formattedInput = formattedInput.replace(urlRegex, (url) => {
			return `<img src="${url}" alt="${url}" style="max-width: 98%; height: auto;" class="m-2 rounded">`;
		});

		return formattedInput;
	}
</script>

<div>
	{@html formatInput(inputString)}
</div>
