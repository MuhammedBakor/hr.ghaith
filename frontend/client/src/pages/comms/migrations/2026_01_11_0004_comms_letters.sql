-- Comms letters storage (P1.3)

CREATE TABLE IF NOT EXISTS comms_letters (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  branch_id TEXT NULL,
  doc_no TEXT NOT NULL,
  kind TEXT NOT NULL,
  template_key TEXT NOT NULL,
  leader_module TEXT NOT NULL,
  html TEXT NOT NULL,
  qr_data TEXT NULL,
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_comms_letters_doc_no
ON comms_letters(org_id, branch_id, doc_no);

CREATE INDEX IF NOT EXISTS idx_comms_letters_org_created
ON comms_letters(org_id, created_at);
