-- Phase 3: Default write account + overflow priority for upload dispatch.
-- One default write per user; overflow_priority lower = used first when default is full.

-- Add columns to linked_accounts
alter table public.linked_accounts
  add column if not exists is_default_write boolean not null default false,
  add column if not exists overflow_priority integer not null default 0;

comment on column public.linked_accounts.is_default_write is 'When true, this account is preferred for uploads when no account/folder is specified. One per user.';
comment on column public.linked_accounts.overflow_priority is 'Lower value = used first when default write account is full. Used with default+overflow dispatch.';

-- One default-write account per user
create unique index if not exists linked_accounts_single_default_write_per_user_idx
  on public.linked_accounts (user_id)
  where is_default_write = true;

-- Index for dispatch: default first, then overflow order
create index if not exists linked_accounts_user_default_overflow_idx
  on public.linked_accounts (user_id, is_default_write desc, overflow_priority asc);

-- Backfill: set is_default_write = true for the (single) active account per user
update public.linked_accounts
set is_default_write = true
where is_active = true;
