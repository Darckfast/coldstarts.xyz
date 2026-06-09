<script lang="ts">
    import { onMount } from "svelte";

    type Results = {
        edge: string;
        times: Array<number>;
        loading: string;
        completed: boolean;
        half_completed: boolean;
        error: undefined | number;
    };
    let data = $state<Array<Results>>([]);
    let spinner = $state("");
    let timePlaceholder = $state(0);
    const seq = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const ITEMS_EXPECTED = 13;

    onMount(() => {
        let ldb = document.getElementById("loading-bar");
        let WIDTH = Math.floor(ldb?.clientWidth / 10) * 2;
        const sse = new EventSource("/measure");

        sse.onmessage = (e) => {
            let results = JSON.parse(e.data);

            for (let j = 0; j < results.length; j++) {
                let result = results[j];
                let i = data.findIndex((x) => x.edge === result.edge);

                if (result.id) {
                    return;
                }

                if (i === -1) {
                    data.push({
                        edge: result.edge,
                        times: [result.time],
                        loading: ".",
                        completed: false,
                    });
                } else {
                    data[i].datacenter = result.datacenter;
                    data[i].error = result.error;
                    data[i].times.push(result.time);
                    data[i].times.sort((a, b) => a - b);
                }

                console.log("recv:", result);
            }
        };

        let CHUNK_INTERNVAL = 3_000;
        let interval = setInterval(() => {
            let completed = false;
            timePlaceholder = Math.floor(Math.random() * 1000);
            for (let i = 0; i < data.length; i++) {
                completed = false;
                let item = data[i];

                let ci = item.loading.lastIndexOf(".");
                if ((item.times.length === 3 || item.error) && ci === -1) {
                    item.completed = true;
                    item.half_completed = true;
                    completed = true;
                    continue;
                }

                if (
                    item.times.length >= 2 &&
                    item.loading.length >= Math.floor(WIDTH / 2)
                ) {
                    item.half_completed = true;
                }

                let chr = ".";
                if (item.loading.length >= Math.floor(WIDTH / 2)) {
                    chr = ":";
                }

                if (chr === ".") {
                    item.loading += chr;
                } else {
                    if (ci !== -1) {
                        item.loading =
                            item.loading.substring(0, ci) +
                            chr +
                            item.loading.substring(ci + 1);
                    }
                }
            }

            if (completed) {
                clearInterval(interval);
            }
        }, CHUNK_INTERNVAL / WIDTH);

        let i = 0;
        const spnInv = setInterval(() => {
            spinner = seq[i];
            i = (i + 1) % seq.length;
        }, 200);

        return () => {
            sse.close();
            clearInterval(spnInv);
        };
    });
</script>

<section
    class="flex h-full w-full flex-col items-center justify-center gap-8 sm:w-full lg:w-4/5"
>
    <h1 class="text-5xl font-bold">Edge Runtime's Cold Starts</h1>
    <div class="flex h-full w-full flex-col gap-8 border border-white p-10">
        {#if data.length === 0}
            {#each { length: ITEMS_EXPECTED }}
                <div class="w-full flex items-center justify-center">
                    <span class="flex flex-col leading-tight">
                        <span>░░░░░░░░░░░░</span>
                        <span class="text-black bg-white w-full text-center"
                            >{`{ source }`}
                        </span>
                        <span>░░░░░░░░░░░░</span>
                    </span>
                    <div
                        id="loading-bar"
                        class="w-full flex flex-col justify-center items-center"
                    >
                        <span class="text-gray-500"
                            >{spinner} loading results...</span
                        >
                    </div>

                    <span class="flex flex-col leading-tight">
                        <span>░░░░░░░░░░░░</span>
                        <span class="text-black bg-white w-full text-center"
                            >{`> edge <`}</span
                        >
                        <span>░░░░░░░░░░░░</span>
                    </span>
                </div>
            {/each}
        {/if}
        {#each data as d}
            <div class="w-full flex items-center justify-center">
                <span
                    class="flex flex-col leading-tight"
                    class:bg-red-500!={d.error !== undefined}
                    class:text-white!={d.error !== undefined}
                >
                    <span>░░░░░░░░░░░░</span>
                    <span class="text-black bg-white w-full text-center"
                        >{`{ source }`}
                    </span>
                    <span class="flex"
                        >░░░░░░░
                        {#if d.error}
                            <span class="text-bold w-full text-end">error</span>
                        {:else if d.completed}
                            <span
                                class="text-black bg-white text-bold w-full text-end"
                                >{d.times[2] - d.times[0]}ms</span
                            >
                        {:else}
                            <span
                                class="text-black bg-white text-bold w-full text-end"
                                >{timePlaceholder}</span
                            >
                        {/if}
                    </span>
                </span>
                <div class="w-full flex flex-col justify-center items-center">
                    <span class="w-full text-gray-500">{d.loading}</span>
                    <span class="absolute text-gray-300 bg-black px-2"
                        >{d.datacenter}</span
                    >
                </div>

                <span
                    class="flex flex-col leading-tight"
                    class:bg-red-500!={d.error !== undefined}
                    class:text-white!={d.error !== undefined}
                >
                    <span>░░░░░░░░░░░░</span>
                    <span class="text-black bg-white w-full text-center"
                        >{`> ${d.edge} <`}</span
                    >
                    <span
                        class="flex text-bold w-full text-start justify-between"
                    >
                        {#if d.error}
                            <span class="">error</span>
                        {:else if d.half_completed}
                            <span class="text-black bg-white w-full"
                                >{d.times[1] - d.times[0]}ms</span
                            >
                        {:else}
                            <span class="text-black bg-white w-full"
                                >{timePlaceholder}</span
                            >
                        {/if}
                        <span>░░░░░░░</span>
                    </span>
                </span>
            </div>
        {/each}
    </div>
    <div class="flex gap-4 flex-col">
        <h3 class="text-3xl font-bold">Methodology</h3>
        <p>
            A CloudFlare Worker fires a series of request, and we measure the
            time when the request was made, when the targeted edge sends a
            response, and when this request reaches our source.
        </p>

        <p>
            the <span class="text-black bg-white">{"{ source }"}</span> sends a
            HTTP request to the
            <span class="text-black bg-white">{"> edge <"}</span>
            with no payload, and the
            <span class="text-black bg-white">{"> edge <"}</span> sends a
            response containing a timestamp of when it was processed, then we
            mark when this response was received by the
            <span class="text-black bg-white">{"{ source }"}</span>
        </p>
        <p>
            The time from <span class="text-black bg-white">{"{ source }"}</span
            >
            to
            <span class="text-black bg-white">{"> edge <"}</span>
            can viewed at the right most. The time from
            <span class="text-black bg-white">{"{ source }"}</span>
            back to <span class="text-black bg-white">{"{ source }"}</span>
            can be viewed at the left most
        </p>
        <p>
            So far we include the measured cold stars for: CloudFlare Workers
            and CloudFlare Workers w/ WASM
        </p>
    </div>
    <div class="flex gap-4 flex-col">
        <h3 class="text-3xl font-bold">Why?</h3>
        <p>
            Inspired by <a
                class="font-bold underline"
                href="https://maxday.github.io/lambda-perf/"
                >"Lambda Cold Start benchmark by maxday"</a
            > I wanted a reliable way to help me measure and compare cold starts
            between multiple host providers and runtimes, including WASM vs Native
            for research purposes.
        </p>
    </div>
</section>
