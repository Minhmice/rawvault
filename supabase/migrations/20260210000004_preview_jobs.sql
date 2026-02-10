-- RawVault MVP: preview_jobs table (queue) + RLS
-- One logical change: preview_jobs table and row-level security.
-- Rollback: drop policy, drop table (see end).

CREATE TABLE preview_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  status preview_job_status NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_preview_jobs_file_id ON preview_jobs(file_id);
CREATE INDEX idx_preview_jobs_status ON preview_jobs(status);
CREATE INDEX idx_preview_jobs_owner_id ON preview_jobs(owner_id);

ALTER TABLE preview_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY preview_jobs_owner_policy ON preview_jobs
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Rollback (run manually if needed):
-- DROP POLICY IF EXISTS preview_jobs_owner_policy ON preview_jobs;
-- DROP TABLE IF EXISTS preview_jobs;
