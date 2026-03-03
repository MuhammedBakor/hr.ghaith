
CREATE TABLE IF NOT EXISTS public_visibility_rules (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  branch_id CHAR(26) NULL,
  website_id CHAR(26) NULL,
  entity_type VARCHAR(30) NOT NULL,  -- page/project/landing/offer/blog_post
  entity_id CHAR(36) NOT NULL,
  visibility_json JSON NOT NULL,     -- { "anonymous":"public|hidden", "staff":"public|hidden", "admin":"public|hidden" }
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_visibility_entity (org_id, entity_type, entity_id),
  INDEX idx_visibility_site (website_id, entity_type, updated_at)
);

CREATE TABLE IF NOT EXISTS public_website_domains (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  branch_id CHAR(26) NULL,
  website_id CHAR(26) NOT NULL,
  domain VARCHAR(190) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING/ACTIVE/FAILED
  notes VARCHAR(240) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_domain (domain),
  INDEX idx_domains_site (website_id, status, updated_at)
);
