-- Phase 4: provider OAuth token lifecycle support (MVP-minimal)
-- Additive only: no destructive rewrites, no policy broadening.

do $$
begin
  if to_regclass('public.linked_accounts') is null then
    raise exception
      'Phase 4 token lifecycle migration requires public.linked_accounts to exist before applying this migration.';
  end if;

  alter table public.linked_accounts
    add column if not exists refresh_token_expires_at timestamptz,
    add column if not exists token_refreshed_at timestamptz,
    add column if not exists token_invalid_at timestamptz,
    add column if not exists token_invalid_reason text,
    add column if not exists provider_account_metadata jsonb;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'linked_accounts_access_token_non_empty'
      and conrelid = 'public.linked_accounts'::regclass
  ) then
    alter table public.linked_accounts
      add constraint linked_accounts_access_token_non_empty
      check (
        access_token_encrypted is null
        or length(btrim(access_token_encrypted)) > 0
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'linked_accounts_refresh_token_non_empty'
      and conrelid = 'public.linked_accounts'::regclass
  ) then
    alter table public.linked_accounts
      add constraint linked_accounts_refresh_token_non_empty
      check (
        refresh_token_encrypted is null
        or length(btrim(refresh_token_encrypted)) > 0
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'linked_accounts_token_invalid_reason_non_empty'
      and conrelid = 'public.linked_accounts'::regclass
  ) then
    alter table public.linked_accounts
      add constraint linked_accounts_token_invalid_reason_non_empty
      check (
        token_invalid_reason is null
        or length(btrim(token_invalid_reason)) > 0
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'linked_accounts_token_invalid_reason_requires_timestamp'
      and conrelid = 'public.linked_accounts'::regclass
  ) then
    alter table public.linked_accounts
      add constraint linked_accounts_token_invalid_reason_requires_timestamp
      check (token_invalid_reason is null or token_invalid_at is not null);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'linked_accounts_provider_account_metadata_object'
      and conrelid = 'public.linked_accounts'::regclass
  ) then
    alter table public.linked_accounts
      add constraint linked_accounts_provider_account_metadata_object
      check (
        provider_account_metadata is null
        or jsonb_typeof(provider_account_metadata) = 'object'
      );
  end if;

  create index if not exists linked_accounts_user_token_invalid_idx
    on public.linked_accounts (user_id, token_invalid_at desc)
    where token_invalid_at is not null;

  create index if not exists linked_accounts_user_expires_refresh_idx
    on public.linked_accounts (user_id, expires_at, refresh_token_expires_at);

  -- Keep ownership guardrails explicit for user-scoped access.
  alter table public.linked_accounts enable row level security;

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
