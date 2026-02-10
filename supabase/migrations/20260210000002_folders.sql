-- RawVault MVP: folders table + RLS
-- One logical change: folders table and row-level security.
-- Rollback: drop policy, drop table (see end).

CREATE TABLE folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  parent_id uuid REFERENCES folders(id),
  name text NOT NULL,
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_folders_owner_id ON folders(owner_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_deleted_at ON folders(deleted_at) WHERE deleted_at IS NULL;

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY folders_owner_policy ON folders
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Rollback (run manually if needed):
-- DROP POLICY IF EXISTS folders_owner_policy ON folders;
-- DROP TABLE IF EXISTS folders;
