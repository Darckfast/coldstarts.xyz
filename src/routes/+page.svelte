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

                if (result.id) {
                    return;
                }

                if (result.clear) {
                    let idx = data.findIndex((x) => x.edge === result.clear);

                    if (idx !== -1) {
                        data[idx].times = [];
                    }

                    return;
                }

                let i = data.findIndex((x) => x.edge === result.edge);
                let micro = String(result.time);
                if (micro.length <= 13) {
                    result.time *= 1000;
                }

                if (i === -1) {
                    data.push({
                        edge: result.edge,
                        times: [result.time],
                        loading: ".",
                        completed: false,
                    });
                } else {
                    let item = data[i];

                    if (item.times.length === 3) {
                        item.times.shift();
                    }

                    data[i].error = result.error;
                    data[i].times.push(result.time);

                    if (result.metadata) {
                        data[i].metadata = JSON.parse(result.metadata);
                        data[i].coldstart = item.times[2] - item.times[1];
                        data[i].coldstart -=
                            (item.times[0] - data[i].metadata.first_byte) / 2;

                        data[i].coldstart /= 1_000;
                        data[i].coldstart = data[i].coldstart.toFixed(2);

                        data.sort((a, b) => a.coldstart - b.coldstart);
                    }
                }

                console.log("recv:", result);
            }
        };

        let CHUNK_INTERNVAL = 2_000;
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

    function formatNum(end, start) {
        return ((end - start) / 1000).toFixed(2);
    }
</script>

<section
    class="flex h-full w-full flex-col items-center justify-center gap-8 sm:w-full lg:w-4/5"
>
    <h1 class="sm:text-5xl font-bold text-xl">[■] ./edge_cold_starts</h1>
    <div
        class="flex h-full w-full flex-col sm:gap-8 gap-4 border border-white p-1 sm:p-10"
    >
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
            <div
                class="sm:w-full flex items-center justify-center sm:grid sm:grid-cols-6"
            >
                <span
                    class="hidden sm:flex flex-col leading-tight relative"
                    class:bg-red-500!={d.error !== undefined}
                    class:text-white!={d.error !== undefined}
                >
                    <div
                        class="bg-[radial-gradient(white_1px,transparent_1px)] bg-size-[3px_3px] opacity-20 w-full h-full absolute"
                    ></div>
                    <div
                        class="text-white w-full text-center flex justify-center items-center gap-1 p-2"
                    >
                        <span class="font-bold">{`{`}</span>
                        <span>source</span>
                        <span class="font-bold">{`}`}</span>
                    </div>
                </span>
                <div
                    class="sm:w-full flex flex-col justify-center items-center sm:col-span-4 sm:col-start-2"
                    class:bg-red-500!={d.error !== undefined}
                    class:text-white!={d.error !== undefined}
                >
                    <span class="sm:w-full hidden sm:flex text-gray-500"
                        >{d.loading}</span
                    >
                    {#if d.error}
                        <span class="font-bold">ERROR</span>
                    {:else}
                        <div
                            class="sm:absolute text-gray-300 flex gap-1 flex-col jutify-center sm:items-center items-start"
                        >
                            <div class="flex gap-1 bg-black px-1">
                                <label for="cs">Cold:</label>
                                <span id="cs" class="font-bold"
                                    >{d.coldstart}ms</span
                                >
                            </div>
                            <div
                                class="flex flex-wrap gap-2 text-xs bg-black px-1"
                            >
                                <div class="flex">
                                    <label for="region" class="font-bold"
                                        >Region:</label
                                    >
                                    <span id="region" class="uppercase"
                                        >{d.metadata?.datacenter || "N/A"}</span
                                    >
                                </div>
                                <div class="flex">
                                    <label for="dns">DNS:</label>
                                    <span id="dns" class="font-bold"
                                        >{formatNum(
                                            d.metadata?.dns_lookup_end,
                                            d.metadata?.dns_lookup_start,
                                        )}ms
                                    </span>
                                </div>
                                <div class="flex">
                                    <label for="tcp">TCP: </label>
                                    <span id="tcp" class="font-bold"
                                        >{formatNum(
                                            d.metadata?.tcp_handshake_end,
                                            d.metadata?.tcp_handshake_start,
                                        )}ms</span
                                    >
                                </div>
                                <div class="flex">
                                    <label for="tls">TLS: </label>
                                    <span id="tls" class="font-bold"
                                        >{formatNum(
                                            d.metadata?.tls_handshake_end,
                                            d.metadata?.tls_handshake_start,
                                        )}ms</span
                                    >
                                </div>
                                <div class="flex">
                                    <label for="fb">First-Byte: </label>
                                    <span id="fb" class="font-bold"
                                        >{formatNum(
                                            d.metadata?.first_byte,
                                            d.times[0],
                                        )}ms</span
                                    >
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <span
                    class="flex flex-col leading-tight relative"
                    class:bg-red-500!={d.error !== undefined}
                    class:text-white!={d.error !== undefined}
                >
                    <div
                        class="bg-[radial-gradient(white_1px,transparent_1px)] bg-size-[3px_3px] opacity-20 w-full h-full absolute"
                    ></div>
                    {#if d.repo}
                        <a class="font-bold underlined" href={d.repo}>
                            {"<code/>"}
                        </a>
                    {/if}
                    <div
                        class="text-black bg-white w-full text-center flex gap-1 justify-center items-center p-2"
                    >
                        <span class="font-bold">{`>`}</span>
                        <span>{d.edge}</span>
                        <span class="font-bold">{`<`}</span>
                    </div>
                </span>
            </div>
        {/each}
    </div>
    <div class="flex gap-4 flex-col p-2">
        <h3 class="text-3xl font-bold">Methodology</h3>
        <p>
            A CronJob hosted on <a
                class="font-bold underline"
                href="https://render.com">Render.com</a
            >, in Virginia (US East), fires a series of HTTP requests every hour
            to the
            <span class="text-black bg-white">{"> edge <"}</span>, and we
            measure DNS Lookup, TCP Handshake, TLS Handshake, First-Byte, and
            Coldstart times from the
            <span class="text-black bg-white">{"{ source }"}</span>.
        </p>
        <p>
            So far we include the measured cold stars for CloudFlare Workers,
            Vercel Fluid Compute, Netlify Functions, Deno Deploy, and Fastly
            Compute. Using Go, NodeJS, Bun, Deno, Rust and WebAssembly
        </p>
    </div>
    <div class="flex gap-4 flex-col p-2">
        <h3 class="text-3xl font-bold">Why?</h3>
        <p>
            Inspired by <a
                class="font-bold underline"
                href="https://maxday.github.io/lambda-perf/"
                >"Lambda Cold Start benchmark by maxday"</a
            >. I wanted a reliable way to help me measure and compare cold
            starts between multiple host providers and runtimes, including WASM
            vs. Native, for research purposes.
        </p>
    </div>
</section>
