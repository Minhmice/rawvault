-- RawVault MVP: files table + RLS
-- One logical change: files table and row-level security.
-- Rollback: drop policy, drop table (see end).

CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  folder_id uuid NOT NULL REFERENCES folders(id),
  name text NOT NULL,
  ext text NOT NULL,
  mime text NOT NULL,
  size_bytes bigint NOT NULL,
  storage_key_original text NOT NULL,
  storage_key_thumb text,
  storage_key_preview text,
  preview_status preview_status NOT NULL DEFAULT 'pending',
  error_code text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_files_owner_id ON files(owner_id);
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_preview_status ON files(preview_status);
CREATE INDEX idx_files_deleted_at ON files(deleted_at) WHERE deleted_at IS NULL;

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY files_owner_policy ON files
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Rollback (run manually if needed):
-- DROP POLICY IF EXISTS files_owner_policy ON files;
-- DROP TABLE IF EXISTS files;
