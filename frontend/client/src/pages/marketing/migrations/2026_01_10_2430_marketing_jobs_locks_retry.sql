-- v4.50.0: strengthen marketing_jobs with locks + retries + audit linkage
ALTER TABLE marketing_jobs
  ADD COLUMN IF NOT EXISTS lock_key VARCHAR(80) NULL,
  ADD COLUMN IF NOT EXISTS locked_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_audit_id BIGINT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_lock ON marketing_jobs (lock_key, locked_at);
