
CREATE TABLE IF NOT EXISTS public_pages (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  website_id CHAR(26) NOT NULL,
  slug VARCHAR(190) NOT NULL,
  title VARCHAR(190) NOT NULL,
  content_md MEDIUMTEXT,
  seo_json JSON,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  published_snapshot_id CHAR(36),
  created_by CHAR(36),
  updated_by CHAR(36),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_page_slug (website_id, slug)
);

CREATE TABLE IF NOT EXISTS public_projects (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  branch_id CHAR(26),
  website_id CHAR(26) NOT NULL,
  title VARCHAR(190) NOT NULL,
  description_md MEDIUMTEXT,
  gallery_json JSON,
  location VARCHAR(190),
  year INT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_by CHAR(36),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS public_media_assets (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  website_id CHAR(26) NOT NULL,
  file_name VARCHAR(255),
  mime_type VARCHAR(80),
  size_bytes INT,
  path VARCHAR(255),
  status VARCHAR(20) DEFAULT 'UPLOADED',
  created_by CHAR(36),
  created_at DATETIME NOT NULL
);
