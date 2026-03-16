-- Phase 4: Split storage MVP — files can be split across multiple drives; file_parts store per-part metadata.

-- Viewer mode: inline (browser preview) or download_only (no stream, download only)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'file_viewer_mode') then
    create type public.file_viewer_mode as enum ('inline', 'download_only');
  end if;
end
$$;

-- Add columns to files
alter table public.files
  add column if not exists is_split boolean not null default false,
  add column if not exists viewer_mode public.file_viewer_mode not null default 'inline';

comment on column public.files.is_split is 'When true, file content is stored in multiple parts (file_parts).';
comment on column public.files.viewer_mode is 'inline = allow stream preview; download_only = stream returns 403, use download.';

-- Table: one row per part of a split file (or single part if we ever use it for non-split)
create table if not exists public.file_parts (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  part_index integer not null,
  drive_id uuid not null references public.linked_accounts(id) on delete restrict,
  provider_file_id text not null,
  size_bytes bigint not null,
  constraint file_parts_part_index_non_negative check (part_index >= 0),
  constraint file_parts_size_non_negative check (size_bytes >= 0)
);

create index if not exists file_parts_file_id_idx on public.file_parts (file_id);
create index if not exists file_parts_file_id_part_index_idx on public.file_parts (file_id, part_index);

alter table public.file_parts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'file_parts'
      and policyname = 'file_parts_via_file_owner'
  ) then
    create policy file_parts_via_file_owner
      on public.file_parts
      for all
      using (
        exists (
          select 1 from public.files f
          where f.id = file_parts.file_id and f.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.files f
          where f.id = file_parts.file_id and f.user_id = auth.uid()
        )
      );
  end if;
end
$$;
