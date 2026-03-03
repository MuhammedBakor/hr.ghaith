
CREATE TABLE IF NOT EXISTS public_landing_pages (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  website_id CHAR(26) NOT NULL,
  campaign_id CHAR(36) NULL,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(190) NOT NULL,
  blocks_json JSON NULL,
  seo_json JSON NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  published_snapshot_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_landing_slug (website_id, slug),
  INDEX idx_landing_campaign (website_id, campaign_id, status)
);

CREATE TABLE IF NOT EXISTS public_brand_settings (
  website_id CHAR(26) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  branch_id CHAR(26) NULL,
  brand_json JSON NULL,
  tone_json JSON NULL,
  updated_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS public_store_offers (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  website_id CHAR(26) NOT NULL,
  title VARCHAR(190) NOT NULL,
  description VARCHAR(600) NULL,
  price_amount DECIMAL(12,2) NULL,
  currency VARCHAR(10) NULL,
  media_asset_id CHAR(36) NULL,
  stock_ref VARCHAR(64) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_offers_site (website_id, status, updated_at)
);
