import type { RequestHandler } from "../$types";

async function measureTimes(edge, stub, platform, request, fetchFn) {
    let key = `edge:${edge}:${new Date().setMinutes(0, 0, 0)}`
    let result = await platform?.env.TIMES.get(key)

    if (result) {
        let saved = JSON.parse(result)
        for (let i = 0; i < saved.length; i++) {
            stub.pushData(JSON.stringify(saved[i]))
        }

        return
    }

    let srcDc = request.cf?.colo || 'Unknown'
    let results = []
    let proms = []
    let measures = { edge, time: Date.now(), error: undefined, datacenter: `${srcDc} ->` }
    proms.push(stub.pushData(JSON.stringify(measures)))
    results.push(structuredClone(measures))

    let rs = await fetchFn()

    measures.datacenter += rs.headers.get('x-datacenter') || " Unknown"

    if (!rs.ok) {
        measures.time = Date.now()
        measures.error = rs.status
        proms.push(stub.pushData(JSON.stringify(measures)))
        results.push(structuredClone(measures))

        console.error('error fetching api', rs.status, rs.url)
        await Promise.allSettled(proms)
    } else {
        let body = await rs.json()
        measures.time = body.time
        proms.push(stub.pushData(JSON.stringify(measures)))
        results.push(structuredClone(measures))

        measures.time = Date.now()
        proms.push(stub.pushData(JSON.stringify(measures)))
        results.push(structuredClone(measures))

        proms.push(platform.env.TIMES.put(key, JSON.stringify(results)))
        await Promise.allSettled(proms)
    }
}

export const GET: RequestHandler = async ({ platform, request, fetch }) => {
    let stub = platform?.env.DURABLE_SSE.getByName("cold-starts")
    let stream = await stub.createStream()

    let cfWorkerFn = () => fetch(new URL(platform.env.WORKER_URL), {
        method: "post",
        Headers: {
            'content-type': 'application/json'
        },
    })

    let cfWorkerGoWasmFn = () => fetch(new URL(platform.env.WORKER_GO_URL), {
        method: "post",
        Headers: {
            'content-type': 'application/json'
        },
    })

    platform?.ctx.waitUntil((async () => {
        await Promise.allSettled([
            measureTimes('cloudflare-worker', stub, platform, request, cfWorkerFn),
            measureTimes('cloudflare-worker-go', stub, platform, request, cfWorkerGoWasmFn)
        ])
    })())

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

