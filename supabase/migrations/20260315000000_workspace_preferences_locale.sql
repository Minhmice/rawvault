-- Add locale to workspace_preferences for i18n (en | vi).
-- RLS unchanged; owner-only policy already applies to all columns.

alter table public.workspace_preferences
  add column if not exists locale text not null default 'en';

alter table public.workspace_preferences
  add constraint workspace_preferences_locale_check
  check (locale in ('en', 'vi'));

comment on column public.workspace_preferences.locale is 'User UI locale: en (English) or vi (Tiếng Việt).';
