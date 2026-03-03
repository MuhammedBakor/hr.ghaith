-- v4.47.0: marketing campaigns + abuse logs
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  org_id BIGINT NOT NULL,
  branch_id BIGINT NULL,
  website_id BIGINT NULL,

  code VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT|ACTIVE|ARCHIVED
  name VARCHAR(190) NOT NULL,
  objective VARCHAR(60) NULL, -- leads|traffic|sales|brand

  utm_json JSON NULL,
  schedule_json JSON NULL,
  settings_json JSON NULL,

  audience_json JSON NULL,
  budget_json JSON NULL,
  meta_json JSON NULL,

  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,

  INDEX idx_campaign_org (org_id, status),
  UNIQUE KEY uq_campaign_code (org_id, code)
);

CREATE TABLE IF NOT EXISTS marketing_campaign_assets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  org_id BIGINT NOT NULL,
  campaign_id BIGINT NOT NULL,
  asset_type VARCHAR(30) NOT NULL, -- ad_copy|blog_post|landing_blocks|image_prompt
  title VARCHAR(140) NULL,
  content_json JSON NULL,
  content_md MEDIUMTEXT NULL,
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_campaign_assets (org_id, campaign_id, asset_type)
);

CREATE TABLE IF NOT EXISTS public_abuse_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  org_id BIGINT NULL,
  website_id BIGINT NULL,
  ip VARCHAR(64) NOT NULL,
  route VARCHAR(180) NOT NULL,
  reason VARCHAR(80) NOT NULL,
  meta_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_abuse_route_time (route, created_at),
  INDEX idx_abuse_ip_time (ip, created_at)
);
