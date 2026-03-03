-- v4.46.0: content snapshots for public_site (pages/landing/blog/profile blocks)
CREATE TABLE IF NOT EXISTS public_content_snapshots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  org_id BIGINT NOT NULL,
  branch_id BIGINT NULL,
  website_id BIGINT NULL,
  entity_type VARCHAR(40) NOT NULL, -- page|landing|blog_post|profile|terms
  entity_id BIGINT NOT NULL,
  version_no INT NOT NULL DEFAULT 1,
  doc_no VARCHAR(64) NOT NULL,
  hash_sha256 VARCHAR(64) NULL,
  content_json JSON NULL,
  theme_json JSON NULL,
  seo_json JSON NULL,
  visibility_json JSON NULL,
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_snap_org_entity (org_id, entity_type, entity_id),
  UNIQUE KEY uq_snap_doc_no (doc_no)
);

-- optional: add published pointers if tables exist (best-effort, harmless if already there)
-- These ALTERs may fail on some DBs if columns exist; keep separate if your migration runner supports ignore.
