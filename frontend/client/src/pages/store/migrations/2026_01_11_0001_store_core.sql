-- Store / Commerce core tables (logical starter)
-- NOTE: Adjust to your DB style (uuid generation) and naming conventions.

CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  branch_id TEXT NULL,
  sku TEXT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  price_json TEXT NOT NULL DEFAULT '{}',
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_store_products_org_status ON store_products(org_id, status);

CREATE TABLE IF NOT EXISTS store_orders (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  branch_id TEXT NULL,
  customer_id TEXT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  totals_json TEXT NOT NULL DEFAULT '{}',
  lines_json TEXT NOT NULL DEFAULT '[]',
  finance_intent_id TEXT NULL,
  inventory_reserve_id TEXT NULL,
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_store_orders_org_status ON store_orders(org_id, status);
