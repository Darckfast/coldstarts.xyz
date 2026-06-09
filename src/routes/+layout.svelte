<script lang="ts">
    import favicon from "$lib/assets/favicon.svg";
    import "./layout.css";

    let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<main class="mt-8 flex flex-col items-center justify-center text-white">
    {@render children()}
</main>

<footer class="text-white w-full flex justify-center bottom-0 p-8">
    Made by <a class="font-bold underline" href="https://darckfast.com">
        @darckfast</a
    >
</footer>
