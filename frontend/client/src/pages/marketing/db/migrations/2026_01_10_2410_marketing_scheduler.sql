
CREATE TABLE IF NOT EXISTS marketing_scheduler_queue (
  id CHAR(36) PRIMARY KEY,
  org_id CHAR(26) NOT NULL,
  branch_id CHAR(26) NULL,
  website_id CHAR(26) NULL,
  campaign_id CHAR(36) NOT NULL,
  task_type VARCHAR(30) NOT NULL,   -- content_job / image_job
  payload_json JSON NOT NULL,
  due_at DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED', -- QUEUED/RUNNING/DONE/FAILED
  error_text VARCHAR(600) NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_sched_due (org_id, status, due_at)
);
