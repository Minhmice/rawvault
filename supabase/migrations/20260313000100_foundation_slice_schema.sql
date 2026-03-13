-- Foundation slice schema for RawVault (MVP)
-- Scope-limited to: linked_accounts, folders, files, share_links, activity_logs, workspace_preferences

create extension if not exists pgcrypto;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'storage_provider') then
    create type public.storage_provider as enum ('gdrive', 'onedrive');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_health_status') then
    create type public.account_health_status as enum ('healthy', 'degraded', 'error');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'file_preview_status') then
    create type public.file_preview_status as enum ('pending', 'processing', 'ready', 'failed');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'file_sync_status') then
    create type public.file_sync_status as enum ('pending', 'syncing', 'synced', 'failed');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'share_resource_type') then
    create type public.share_resource_type as enum ('file', 'folder');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_layout_mode') then
    create type public.workspace_layout_mode as enum ('grid', 'list');
  end if;
end
$$;

-- linked_accounts
create table if not exists public.linked_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider public.storage_provider not null,
  provider_account_id text not null,
  account_email text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  quota_total_bytes bigint,
  quota_used_bytes bigint,
  is_active boolean not null default true,
  health_status public.account_health_status not null default 'healthy',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint linked_accounts_quota_non_negative
    check ((quota_total_bytes is null or quota_total_bytes >= 0) and (quota_used_bytes is null or quota_used_bytes >= 0)),
  constraint linked_accounts_quota_used_lte_total
    check (quota_total_bytes is null or quota_used_bytes is null or quota_used_bytes <= quota_total_bytes),
  constraint linked_accounts_provider_account_unique
    unique (user_id, provider, provider_account_id)
);

create index if not exists linked_accounts_user_id_idx on public.linked_accounts (user_id);
create index if not exists linked_accounts_user_active_idx on public.linked_accounts (user_id, is_active);
create unique index if not exists linked_accounts_single_active_per_user_idx
  on public.linked_accounts (user_id)
  where is_active = true;

create or replace function public.set_active_linked_account(
  p_user_id uuid,
  p_account_id uuid
)
returns public.linked_accounts
language plpgsql
security invoker
as $$
declare
  v_account public.linked_accounts;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'unauthorized';
  end if;

  update public.linked_accounts
    set is_active = false
    where user_id = p_user_id;

  update public.linked_accounts
    set is_active = true, updated_at = now()
    where id = p_account_id
      and user_id = p_user_id
    returning * into v_account;

  if v_account.id is null then
    raise exception 'linked account not found';
  end if;

  return v_account;
end;
$$;

-- folders
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete set null,
  name text not null,
  path text not null,
  is_favorite boolean not null default false,
  is_pinned boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint folders_parent_not_self check (parent_id is null or parent_id <> id)
);

create index if not exists folders_user_id_idx on public.folders (user_id);
create index if not exists folders_parent_id_idx on public.folders (parent_id);
create index if not exists folders_user_created_at_idx on public.folders (user_id, created_at desc);
create unique index if not exists folders_user_path_active_uniq
  on public.folders (user_id, path)
  where deleted_at is null;

-- files
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  name text not null,
  ext text,
  mime text,
  size_bytes bigint not null,
  storage_provider public.storage_provider not null,
  storage_account_id uuid references public.linked_accounts(id) on delete set null,
  provider_file_id_original text not null,
  provider_file_id_thumb text,
  provider_file_id_preview text,
  preview_status public.file_preview_status not null default 'pending',
  sync_status public.file_sync_status not null default 'pending',
  error_code text,
  metadata jsonb,
  is_favorite boolean not null default false,
  is_pinned boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint files_size_non_negative check (size_bytes >= 0)
);

create index if not exists files_user_id_idx on public.files (user_id);
create index if not exists files_folder_id_idx on public.files (folder_id);
create index if not exists files_user_created_at_idx on public.files (user_id, created_at desc);
create index if not exists files_user_preview_status_idx on public.files (user_id, preview_status);
create index if not exists files_storage_account_id_idx on public.files (storage_account_id);
create unique index if not exists files_user_folder_name_active_uniq
  on public.files (user_id, folder_id, name)
  where deleted_at is null;

-- share_links
create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_type public.share_resource_type not null,
  resource_id uuid not null,
  token text not null unique,
  expires_at timestamptz,
  allow_download boolean not null default true,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists share_links_user_id_idx on public.share_links (user_id);
create index if not exists share_links_resource_lookup_idx on public.share_links (user_id, resource_type, resource_id);
create index if not exists share_links_expires_at_idx on public.share_links (expires_at);

-- activity_logs
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  resource_type public.share_resource_type,
  resource_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_user_created_at_idx on public.activity_logs (user_id, created_at desc);
create index if not exists activity_logs_user_action_idx on public.activity_logs (user_id, action);

-- workspace_preferences
create table if not exists public.workspace_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_id text,
  layout_mode public.workspace_layout_mode not null default 'grid',
  component_config jsonb,
  animation_config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_preferences_user_unique unique (user_id)
);

create index if not exists workspace_preferences_user_id_idx on public.workspace_preferences (user_id);

-- RLS enablement
alter table public.linked_accounts enable row level security;
alter table public.folders enable row level security;
alter table public.files enable row level security;
alter table public.share_links enable row level security;
alter table public.activity_logs enable row level security;
alter table public.workspace_preferences enable row level security;

-- Ownership policies
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'linked_accounts'
      and policyname = 'linked_accounts_owner_only'
  ) then
    create policy linked_accounts_owner_only
      on public.linked_accounts
      for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'folders'
      and policyname = 'folders_owner_only'
  ) then
    create policy folders_owner_only
      on public.folders
      for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'files'
      and policyname = 'files_owner_only'
  ) then
    create policy files_owner_only
      on public.files
      for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'share_links'
      and policyname = 'share_links_owner_only'
  ) then
    create policy share_links_owner_only
      on public.share_links
      for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'activity_logs'
      and policyname = 'activity_logs_owner_only'
  ) then
    create policy activity_logs_owner_only
      on public.activity_logs
      for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_preferences'
      and policyname = 'workspace_preferences_owner_only'
  ) then
    create policy workspace_preferences_owner_only
      on public.workspace_preferences
      for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end
$$;
