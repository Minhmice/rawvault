# Backend-B: Migration Plan & Rollback (RawVault MVP)

## Migration plan

One logical change per migration file (per db-migrations skill).

| Order | File | Description |
|-------|------|-------------|
| 1 | `20260210000001_rawvault_enums.sql` | Create enums: `preview_status`, `preview_job_status`, `preview_error_code` |
| 2 | `20260210000002_folders.sql` | Table `folders` + RLS (owner_id = auth.uid()) |
| 3 | `20260210000003_files.sql` | Table `files` + RLS |
| 4 | `20260210000004_preview_jobs.sql` | Table `preview_jobs` + RLS |

**Storage buckets** are not created by SQL. Run once after migrations:

```bash
npx tsx scripts/ensure-storage-buckets.ts
```

See `docs/storage-policies.md` for bucket names and policies.

## How to run migrations

With Supabase CLI (recommended):

```bash
supabase link   # if not already
supabase db push
```

Or apply manually in order: run each `.sql` file in `supabase/migrations/` against the project database (Supabase SQL Editor or `psql`).

## Rollback steps

Run in **reverse order** (dependencies: preview_jobs → files → folders → enums).

1. **preview_jobs**
   - `DROP POLICY IF EXISTS preview_jobs_owner_policy ON preview_jobs;`
   - `DROP TABLE IF EXISTS preview_jobs;`

2. **files**
   - `DROP POLICY IF EXISTS files_owner_policy ON files;`
   - `DROP TABLE IF EXISTS files;`

3. **folders**
   - `DROP POLICY IF EXISTS folders_owner_policy ON folders;`
   - `DROP TABLE IF EXISTS folders;`

4. **enums**
   - `DROP TYPE IF EXISTS preview_error_code;`
   - `DROP TYPE IF EXISTS preview_job_status;`
   - `DROP TYPE IF EXISTS preview_status;`

Test rollback on a **copy** of the database when possible (e.g. branch or staging).

## Test data notes

- Create a folder via `POST /api/folders` (backend-a).
- Upload a file (sign → upload → `POST /api/files`), then trigger `POST /api/jobs/preview/run`.
- Verify: `files.preview_status` → `ready`, `files.storage_key_thumb` and `storage_key_preview` set, objects in `rawvault-derivatives` bucket.
- For failure path: use an unsupported RAW or corrupt file → expect `preview_status = failed`, `error_code` in taxonomy.

## Env / feature flags

- `SUPABASE_EDGE_FUNCTION_PREVIEW_URL`: if set, backend-a uses Edge Function for preview; otherwise it can call in-process processor (see handoff).
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` required for storage script and job processor.

---

## How to test (backend-b)

1. **Migrations**
   - Run migrations in order (e.g. `supabase db push` or execute each SQL file).
   - Rollback in reverse order; verify tables/policies are dropped.

2. **Storage**
   - Run `npx tsx scripts/ensure-storage-buckets.ts` (with env set).
   - In Supabase Dashboard → Storage, confirm `rawvault-original` and `rawvault-derivatives` exist and are private.

3. **Preview pipeline**
   - Create folder (e.g. via `POST /api/folders`).
   - Upload a file: `POST /api/uploads/sign` → upload to signed URL → `POST /api/files`.
   - Trigger jobs: `POST /api/jobs/preview/run` (with auth). If backend-a has integrated the processor (see handoff), jobs run in-process.
   - Check DB: `files.preview_status` → `ready`, `storage_key_thumb` and `storage_key_preview` set; `preview_jobs.status` → `done`.
   - Check storage: objects in `rawvault-derivatives` for that file path.
   - Failure path: use an unsupported or corrupt file → `preview_status = failed`, `error_code` in taxonomy.
