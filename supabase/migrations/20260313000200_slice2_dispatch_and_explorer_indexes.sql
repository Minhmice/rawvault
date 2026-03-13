-- Slice 2: minimal indexes for explorer reads and upload dispatch tracing.
-- No table drops/rewrites; additive and safe for existing data.

-- Explorer: common child-folder listing by user + parent, active rows only.
create index if not exists folders_user_parent_active_name_idx
  on public.folders (user_id, parent_id, name)
  where deleted_at is null;

-- Explorer: common file listing in a folder by recency, active rows only.
create index if not exists files_user_folder_active_created_at_idx
  on public.files (user_id, folder_id, created_at desc)
  where deleted_at is null;

-- Dispatch tracing: correlate upload-dispatch events by payload.dispatch_id.
-- Assumes activity log payload stores a dispatch_id string key when relevant.
create index if not exists activity_logs_user_dispatch_id_created_at_idx
  on public.activity_logs (user_id, ((payload ->> 'dispatch_id')), created_at desc)
  where payload ? 'dispatch_id';
