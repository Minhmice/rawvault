# Environment Variables

All environment variables used by RawVault, grouped by when they are required.

---

## Required at startup

These are validated when the server starts (e.g. via `validateRequiredEnv()`). If missing, the app fails fast with a clear error.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xxxx.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (publishable) key for client and server. Can be replaced by `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` if using publishable keys. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Alternative to `NEXT_PUBLIC_SUPABASE_ANON_KEY` when using publishable keys. At least one of anon key or publishable key must be set. |
| `RAWVAULT_TOKEN_ENCRYPTION_KEY` | 32-byte key (base64 or hex) used to encrypt/decrypt OAuth tokens at rest. Must be set for storage account linking. |
| `RAWVAULT_OAUTH_STATE_SECRET` | Secret used to sign/verify OAuth state (min length 32). Validated at startup so state creation fails fast if missing. See [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md#6-oauth-state-secret) for how to generate. |

---

## Required on connect (provider-specific)

These are **not** validated at startup. They are checked when a user hits the connect endpoint for a given provider (e.g. Connect Google Drive / Connect OneDrive). If a provider’s vars are missing, only that provider’s connect flow will fail.

### Google Drive

| Variable | Description |
|----------|-------------|
| `RAWVAULT_GDRIVE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console. |
| `RAWVAULT_GDRIVE_CLIENT_SECRET` | OAuth 2.0 Client secret. |
| `RAWVAULT_GDRIVE_OAUTH_CALLBACK_URL` | Authorized redirect URI (must match the URI configured in Google Cloud). |

See [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) for full setup (project, APIs, consent screen, credentials, and `.env.local`).

### OneDrive

| Variable | Description |
|----------|-------------|
| `RAWVAULT_ONEDRIVE_CLIENT_ID` | Application (client) ID from Azure App registration. |
| `RAWVAULT_ONEDRIVE_CLIENT_SECRET` | Client secret from Azure. |
| `RAWVAULT_ONEDRIVE_OAUTH_CALLBACK_URL` | Redirect URI (must match the Web redirect URI in Azure). |

See [ONEDRIVE_SETUP.md](./ONEDRIVE_SETUP.md) for full setup (Azure app, permissions, and `.env.local`).

---

## Optional / development

| Variable | Description |
|----------|-------------|
| `RAWVAULT_DEV_SEEDED_AUTH_ENABLED` | Set to `"true"` to enable deterministic dev seeded auth. |
| `RAWVAULT_SEED_USER_EMAIL` / `RAWVAULT_DEV_SEEDED_EMAIL` | Email for seeded user (when dev seeded auth is enabled). |
| `RAWVAULT_SEED_USER_PASSWORD` / `RAWVAULT_DEV_SEEDED_PASSWORD` | Password for seeded user. |
| `RAWVAULT_DEV_SEEDED_AUTH_TOKEN` | Token required for seeded sign-in when deterministic dev seeded auth is enabled. |

---

## Summary

- **Startup:** Supabase URL, Supabase anon/publishable key, `RAWVAULT_TOKEN_ENCRYPTION_KEY`, `RAWVAULT_OAUTH_STATE_SECRET` (min length 32).
- **On connect:** Google Drive and OneDrive vars are validated only when the user connects that provider; no need to set them if you don’t use that provider.
