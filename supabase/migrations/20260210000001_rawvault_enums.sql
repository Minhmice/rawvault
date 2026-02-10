-- RawVault MVP: enums for files.preview_status, files.error_code, preview_jobs.status
-- One logical change: enums only.
-- Rollback: drop types (see rollback notes at end).

CREATE TYPE preview_status AS ENUM (
  'pending',
  'processing',
  'ready',
  'failed'
);

CREATE TYPE preview_job_status AS ENUM (
  'pending',
  'processing',
  'done',
  'failed'
);

-- Error taxonomy (standard codes for preview failures)
CREATE TYPE preview_error_code AS ENUM (
  'unsupported_raw',
  'conversion_error',
  'timeout',
  'storage_error',
  'invalid_file'
);

-- Rollback (run manually if needed):
-- DROP TYPE IF EXISTS preview_error_code;
-- DROP TYPE IF EXISTS preview_job_status;
-- DROP TYPE IF EXISTS preview_status;
