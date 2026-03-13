# RawVault DB Foundation Status

This document tracks implemented database foundation scope from `PLAN.md`.

## Current implemented MVP-core tables

- `linked_accounts`
- `folders`
- `files`
- `preview_jobs`
- `share_links`
- `activity_logs`
- `workspace_preferences` (present; optional per MVP scope lock)

## Ownership model

- Every user-owned table above has `user_id` and RLS enabled.
- Canonical owner policy shape is `user_id = auth.uid()` for table access.
- `preview_jobs` additionally requires that `preview_jobs.file_id` resolves to a `files` row owned by `auth.uid()`.
- Service-role usage is only for explicitly gated seed/dev tooling; app routes use user-scoped server clients.

## Notes

- This foundation is metadata-only: binaries remain in provider storage.
- Preview job processing behavior is intentionally out of scope here; this slice only establishes durable status state.

## Phase 4 linked account token lifecycle support

`linked_accounts` includes additive Phase 4 lifecycle columns for provider OAuth:

- `access_token_encrypted` (existing)
- `refresh_token_encrypted` (existing)
- `expires_at` (existing; access token expiry)
- `refresh_token_expires_at` (new; optional refresh-token expiry metadata)
- `token_refreshed_at` (new; optional refresh lifecycle timestamp)
- `token_invalid_at` (new; optional invalid-token state timestamp)
- `token_invalid_reason` (new; optional invalid-token reason for app state exposure)
- `provider_account_metadata` (new; optional provider identity metadata payload)

Phase 4 also adds minimal lifecycle safety constraints:

- token strings must be either null or non-empty after trim (`access_token_encrypted`, `refresh_token_encrypted`)
- `token_invalid_reason` requires `token_invalid_at`
- `provider_account_metadata` must be a JSON object when present

Ownership/RLS posture remains user-scoped (`user_id = auth.uid()`) via `linked_accounts_owner_only`.
Phase 4 schema changes are additive and idempotent; no table drops/rewrites are introduced.
Migration enforces dependency order by failing fast if `public.linked_accounts` is missing.
