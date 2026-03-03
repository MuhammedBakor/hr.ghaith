-- v4.48.0: simple scheduler for marketing automation
CREATE TABLE IF NOT EXISTS marketing_jobs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  org_id BIGINT NOT NULL,
  branch_id BIGINT NULL,
  job_type VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  run_at DATETIME NOT NULL,
  payload_json JSON NULL,
  last_error VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_jobs_org_run (org_id, status, run_at)
);
