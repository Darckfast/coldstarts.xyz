-- Migration number: 0001 	 2026-06-09T20:15:40.175Z
CREATE TABLE IF NOT EXISTS "edges" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" INTEGER NOT NULL DEFAULT ( unixepoch('subsec') * 1000 )
);

CREATE TABLE IF NOT EXISTS "history" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "edge_id" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "metadata" TEXT,
    "created_at" INTEGER NOT NULL DEFAULT ( unixepoch('subsec') * 1000 ),
    FOREIGN KEY ("edge_id") REFERENCES "edges"("id")
);

INSERT INTO edges (name) VALUES
('cloudflare-worker'),
('cloudflare-worker-tinygo'),
('vercel-go'),
('vercel-nodejs'),
('vercel-rust'),
('vercel-bun'),
('deno-deploy'),
('deno-deploy-go'),
('netlify'),
('netlify-go'),
('fastly-tinygo'),
('fastly-js'),
('fastly-rust');
