-- Phase 2 completion slice: preview_jobs foundation
-- Scope-limited to minimal status tracking + ownership-safe RLS for MVP.

create table if not exists public.preview_jobs (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.file_preview_status not null default 'pending',
  attempts integer not null default 0,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint preview_jobs_attempts_non_negative check (attempts >= 0)
);

do $$
begin
  -- Compatibility path for older schemas that used owner_id.
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'preview_jobs'
      and column_name = 'owner_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'preview_jobs'
      and column_name = 'user_id'
  ) then
    alter table public.preview_jobs rename column owner_id to user_id;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'preview_jobs'
      and column_name = 'user_id'
  ) then
    alter table public.preview_jobs add column user_id uuid;
  end if;

  update public.preview_jobs p
  set user_id = f.user_id
  from public.files f
  where p.file_id = f.id
    and p.user_id is null;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'preview_jobs'
      and column_name = 'owner_id'
  ) then
    update public.preview_jobs
    set user_id = owner_id
    where user_id is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'preview_jobs'
      and column_name = 'status'
      and udt_name = 'preview_job_status'
  ) then
    alter table public.preview_jobs
      alter column status type public.file_preview_status
      using status::text::public.file_preview_status;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
      and a.attnum = c.conkey[1]
    where c.conrelid = 'public.preview_jobs'::regclass
      and c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass
      and array_length(c.conkey, 1) = 1
      and a.attname = 'user_id'
  ) then
    alter table public.preview_jobs
      add constraint preview_jobs_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if exists (
    select 1
    from public.preview_jobs
    where user_id is null
  ) then
    raise exception 'preview_jobs contains rows with null user_id; manual reconciliation required';
  end if;

  alter table public.preview_jobs alter column user_id set not null;
end
$$;

create index if not exists preview_jobs_user_id_idx on public.preview_jobs (user_id);
create index if not exists preview_jobs_file_id_idx on public.preview_jobs (file_id);
create index if not exists preview_jobs_user_file_created_at_idx
  on public.preview_jobs (user_id, file_id, created_at desc);

alter table public.preview_jobs enable row level security;
drop policy if exists preview_jobs_owner_policy on public.preview_jobs;
drop policy if exists preview_jobs_owner_only on public.preview_jobs;

create policy preview_jobs_owner_only
  on public.preview_jobs
  for all
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.files f
      where f.id = preview_jobs.file_id
        and f.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.files f
      where f.id = preview_jobs.file_id
        and f.user_id = auth.uid()
    )
  );

create or replace function public.enforce_preview_jobs_file_owner_match()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.files f
    where f.id = new.file_id
      and f.user_id = new.user_id
  ) then
    raise exception
      'preview_jobs file ownership mismatch for file_id=% and user_id=%',
      new.file_id,
      new.user_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists preview_jobs_file_owner_match on public.preview_jobs;
create trigger preview_jobs_file_owner_match
  before insert or update of file_id, user_id
  on public.preview_jobs
  for each row
  execute function public.enforce_preview_jobs_file_owner_match();
