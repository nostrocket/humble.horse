<script>
	import { Circle2 } from 'svelte-loading-spinners';
</script>

<div class="flex flex-col items-center justify-center gap-4 py-20 overflow-hidden">
	<div class="flex flex-row">
		<div class="flex flex-col items-center justify-center gap-4 py-20">
			<Circle2 size="30" unit="px" /><Circle2 size="60" unit="px" /><Circle2 size="90" unit="px" /><Circle2 size="120" unit="px" />
		</div>
		<div class="flex flex-col items-center justify-center gap-4 py-20">
			<Circle2 size="120" unit="px" /><Circle2 size="90" unit="px" /><Circle2 size="60" unit="px" /><Circle2 size="30" unit="px" />
		</div>
		<div class="flex flex-col items-center justify-center gap-4 py-20">
			<Circle2 size="30" unit="px" /><Circle2 size="60" unit="px" /><Circle2 size="90" unit="px" /><Circle2 size="120" unit="px" />
		</div>
	</div>
    <!-- <Circle2 size="800" unit="px" /> hodlbod's motto is "you can never have too many spinners", but I don't know about this last one, it might be too much-->
</div>
