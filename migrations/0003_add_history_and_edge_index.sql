-- Migration number: 0003
CREATE INDEX idx_history_created_at ON history (created_at);
CREATE INDEX idx_history_edge_id ON history (edge_id);
CREATE INDEX idx_edges_name ON edges (name);
