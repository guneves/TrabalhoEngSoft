CREATE TABLE IF NOT EXISTS evidence_requests (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  evidence_type  VARCHAR(50) NOT NULL DEFAULT 'digital',
  target_url     TEXT,
  status         VARCHAR(50) NOT NULL DEFAULT 'requested',
  metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_requests_user_id
  ON evidence_requests(user_id);
