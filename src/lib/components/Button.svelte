<script lang="ts">
    export let onClick: () => void;
</script>
<button on:click={onClick} class=" text-slate-800 dark:text-slate-200 focus:outline-none font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center">
    <slot></slot>
</button>