-- Store intents tables (optional, for wiring later)

CREATE TABLE IF NOT EXISTS finance_intents (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  branch_id TEXT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  amount_json TEXT NOT NULL DEFAULT '{}',
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_finance_intents_org_status ON finance_intents(org_id, status);

CREATE TABLE IF NOT EXISTS inventory_reserve_intents (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  branch_id TEXT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  lines_json TEXT NOT NULL DEFAULT '[]',
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_reserve_org_status ON inventory_reserve_intents(org_id, status);
