<script lang="ts">
    export let onClick: () => void;
    export let notifs = 0
</script>
<button on:click={onClick} class="relative text-slate-800 dark:text-slate-200 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center">
    <slot></slot>
    {#if notifs > 0}
    <div
    class="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-sm -top-1 -end-1"
>
    {notifs}
</div>{/if}
</button>
