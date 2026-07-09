<script lang="ts">
    import "./layout.css";

    let { children } = $props();
</script>

<main class="mt-8 flex flex-col items-center justify-center text-white">
    {@render children()}
</main>

<footer class="text-white w-full flex justify-center bottom-0 p-8 gap-2">
    <span> Made by</span>
    <a class="font-bold underline" href="https://darckfast.com"> @darckfast</a>
</footer>
