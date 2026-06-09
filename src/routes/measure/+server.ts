import type { RequestHandler } from "../$types";

let edges = [
    {
        edge: 'cloudflare-worker',
    },
    {
        edge: 'cloudflare-worker-tinygo',
    },
    {
        edge: 'vercel-go',
    },
    {
        edge: 'vercel-nodejs',
    },
    {
        edge: 'vercel-rust',
    },
    {
        edge: 'vercel-bun',
    },
    {
        edge: 'deno-deploy',
    },
    {
        edge: 'deno-deploy-go',
    },
    {
        edge: 'netlify',
    },
    {
        edge: 'netlify-go',
    },
    {
        edge: 'fastly-tinygo',
    },
    {
        edge: 'fastly-js',
    },
    {
        edge: 'fastly-rust',
    },
]

async function measureTimes(stub, platform) {
    let proms = []
    for (let i = 0; i < edges.length; i++) {
        let key = `edge:${edges[i]}:${new Date().setMinutes(0, 0, 0)}`
        let result = await platform?.env.TIMES.get(key)

        if (result) {
            let saved = JSON.parse(result)
            for (let i = 0; i < saved.length; i++) {
                proms.push(stub.pushData(JSON.stringify(saved[i])))
            }
        }
    }

    await Promise.allSettled(proms)
}

export const GET: RequestHandler = async ({ platform }) => {
    let stub = platform?.env.DURABLE_SSE.getByName("cold-starts")
    let stream = await stub.createStream()

    platform?.ctx.waitUntil(measureTimes(stub, platform))

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

