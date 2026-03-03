
-- v4.39.0: Print/Archive standard fields for branch profile
ALTER TABLE public_branch_profiles
  ADD COLUMN IF NOT EXISTS published_snapshot_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS published_doc_no VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS published_at DATETIME NULL;
