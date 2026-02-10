# RawVault Storage Buckets & Policies

## Buckets

| Bucket | Purpose | Private |
|--------|---------|---------|
| `rawvault-original` | Original uploaded files | Yes |
| `rawvault-derivatives` | Thumbnails + previews (thumb 256px, preview 1600px) | Yes |

## Setup

1. Run migrations first (creates `folders`, `files`, `preview_jobs`).
2. Create buckets (one-time):
   ```bash
   npx tsx scripts/ensure-storage-buckets.ts
   ```
   Or create manually in Supabase Dashboard: Storage → New bucket → name as above, **private**.

## Access model

- **Viewer / list**: use signed URLs via `GET /api/files/:id/signed-url?variant=thumb|preview|original` (backend-a). Expiry configurable (e.g. 1h).
- **Upload**: client gets signed upload URL from `POST /api/uploads/sign`, uploads directly to `rawvault-original`.
- **Job processor**: uses **service role** to read from `rawvault-original` and write to `rawvault-derivatives`; updates `files` and `preview_jobs` in DB.

## Storage policies (Supabase Dashboard)

For private buckets, restrict access so that:

- **Select/read**: only objects under path `{owner_id}/...` when `auth.uid() = owner_id` (or use signed URLs and service role for job processor).
- **Insert**: allow authenticated users to upload to path `{auth.uid()}/...`.
- **Update/delete**: only owner or service role.

If using Supabase Storage RLS policies (SQL), example pattern:

- Policy name: `Users can read own objects`
  - Operation: SELECT (or read)
  - Expression: `(bucket_id = 'rawvault-original' OR bucket_id = 'rawvault-derivatives') AND (storage.foldername(name))[1] = auth.uid()::text`

- Service role bypasses RLS for server-side job processor.

## Signed URLs

- Create via Supabase JS: `supabase.storage.from(bucket).createSignedUrl(path, { expiresIn })`.
- TTL: recommend 15–60 min for viewer; 2h for upload (per PRD).
