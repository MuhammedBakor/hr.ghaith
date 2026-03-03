
-- v4.39.0 Campaign Engine + Jobs (content/image)
-- NOTE: Compatible with existing multi-tenant pattern (org_id + optional branch_id + website_id)

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  branch_id CHAR(26) NULL,
  website_id CHAR(26) NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(190) NOT NULL,
  objective VARCHAR(40) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  utm_json JSON NULL,
  schedule_json JSON NULL,
  settings_json JSON NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_campaign_code (org_id, code),
  INDEX idx_campaign_site (website_id, status, updated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS marketing_content_jobs (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  branch_id CHAR(26) NULL,
  website_id CHAR(26) NULL,
  campaign_id CHAR(36) NULL,
  target_type VARCHAR(30) NOT NULL,
  target_id CHAR(36) NULL,
  prompt TEXT NULL,
  inputs_json JSON NULL,
  output_json JSON NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
  error_text VARCHAR(600) NULL,
  apply_action VARCHAR(40) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_content_jobs (org_id, status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS marketing_image_jobs (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  branch_id CHAR(26) NULL,
  website_id CHAR(26) NULL,
  campaign_id CHAR(36) NULL,
  purpose VARCHAR(40) NULL,
  prompt TEXT NULL,
  style_json JSON NULL,
  output_media_asset_id CHAR(36) NULL, -- public_media_assets.id
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
  error_text VARCHAR(600) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_image_jobs (org_id, status, created_at)
) ENGINE=InnoDB;
