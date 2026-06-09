import type { RequestHandler } from "../$types";


async function measureTimes(stub, platform) {
    let { results } = await platform.env.EDGE_DB.prepare(`SELECT 
e.name, 
h.timestamp, 
h.metadata 
    FROM edges e 
    INNER JOIN history h 
        ON h.edge_id = e.id
    WHERE h.created_at >= unixepoch('subsec') * 1000 - 3600000 -1
    ORDER BY h.id`).run()
    let proms = []

    console.log(results)
    for (let i = 0; i < results.length; i++) {
        let edge = results[i]
        proms.push(stub.pushData(JSON.stringify(edge)))
        console.log(edge)
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

