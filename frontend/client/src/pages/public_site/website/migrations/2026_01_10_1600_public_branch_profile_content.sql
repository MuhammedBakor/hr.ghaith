-- v4.34.0 public_site + marketing content

CREATE TABLE IF NOT EXISTS public_branch_profiles (
  id         CHAR(26) NOT NULL PRIMARY KEY,
  org_id     CHAR(26) NOT NULL,
  branch_id  CHAR(26) NULL,
  website_id CHAR(26) NOT NULL,
  title      VARCHAR(190) NOT NULL,
  tagline    VARCHAR(255) NULL,
  about_md   MEDIUMTEXT NULL,
  contact_json JSON NULL,
  socials_json JSON NULL,
  achievements_json JSON NULL,
  gallery_json JSON NULL,
  seo_json    JSON NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_profile_site (website_id),
  INDEX idx_profile_org_branch (org_id, branch_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS public_branch_achievements (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  org_id     CHAR(26) NOT NULL,
  website_id CHAR(26) NOT NULL,
  title      VARCHAR(190) NOT NULL,
  year       INT NULL,
  description VARCHAR(600) NULL,
  media_asset_id CHAR(36) NULL,
  sort_no    INT NOT NULL DEFAULT 100,
  status     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_ach_site (website_id, sort_no)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS public_blog_posts (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  org_id     CHAR(26) NOT NULL,
  website_id CHAR(26) NOT NULL,
  slug       VARCHAR(190) NOT NULL,
  title      VARCHAR(190) NOT NULL,
  excerpt    VARCHAR(600) NULL,
  content_md MEDIUMTEXT NULL,
  cover_asset_id CHAR(36) NULL,
  seo_json   JSON NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT/PUBLISHED/ARCHIVED
  published_at DATETIME NULL,
  published_snapshot_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_blog_slug (website_id, slug),
  INDEX idx_blog_site_status (website_id, status, updated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS public_campaigns (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  org_id     CHAR(26) NOT NULL,
  website_id CHAR(26) NOT NULL,
  code       VARCHAR(64) NOT NULL,
  name       VARCHAR(190) NOT NULL,
  utm_json   JSON NULL,
  landing_slug VARCHAR(190) NULL,
  channel    VARCHAR(60) NULL, -- whatsapp/google/meta/snap/email
  status     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  settings_json JSON NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_campaign_code (website_id, code),
  INDEX idx_campaign_site (website_id, status, updated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS marketing_ai_jobs (
  id         CHAR(36) NOT NULL PRIMARY KEY,
  org_id     CHAR(26) NOT NULL,
  website_id CHAR(26) NOT NULL,
  branch_id  CHAR(26) NULL,
  job_type   VARCHAR(40) NOT NULL, -- image/blog/message/home_section
  prompt     MEDIUMTEXT NOT NULL,
  input_json JSON NULL,
  output_json JSON NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'QUEUED', -- QUEUED/RUNNING/DONE/FAILED
  error_text VARCHAR(600) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_ai_jobs (website_id, status, created_at)
) ENGINE=InnoDB;
