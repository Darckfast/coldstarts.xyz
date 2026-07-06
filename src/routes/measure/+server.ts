import type { RequestHandler } from "../$types";


async function measureTimes(stub, platform) {
    let { results } = await platform.env.EDGE_DB.prepare(`SELECT 
e.name as edge, 
h.timestamp as time, 
h.metadata 
    FROM edges e 
    INNER JOIN history h 
        ON h.edge_id = e.id
    WHERE h.created_at >= unixepoch('subsec') * 1000 - 7200000 -1
    ORDER BY e.name, h.id`).run()
    let proms = []

    for (let i = 0; i < results.length; i++) {
        let edge = results[i]
        proms.push(stub.pushData(JSON.stringify(edge)))
    }

    await Promise.allSettled(proms)
}

export const GET: RequestHandler = async ({ platform, getClientAddress, request }) => {
    let ip = request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') || getClientAddress()
    let limiter = platform?.env.RUSTY_LIMITER.getByName(ip)
    let rs = await limiter.fetch("http://rate-limit")

    if (rs.ok) {
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

    return new Response(null, { status: rs.status, headers: rs.headers })
}

