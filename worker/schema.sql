CREATE TABLE IF NOT EXISTS pray_records (
  visitor_id TEXT PRIMARY KEY,
  pray_count INTEGER NOT NULL DEFAULT 0,
  first_pray_at TEXT NOT NULL,
  last_pray_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pray_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  prayed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pray_events_visitor
ON pray_events(visitor_id);

CREATE INDEX IF NOT EXISTS idx_pray_events_time
ON pray_events(prayed_at);
