# RawVault

A drive-lite application for RAW photographers that uses Supabase for auth and metadata, Google Drive and OneDrive as binary storage backends, and presents users with one unified file library.

---

## Project Overview

RawVault proves that:
- The storage abstraction works
- Provider-backed uploads work
- Metadata stays consistent
- Users can manage and access files through one unified interface

**Architecture:** Next.js App Router + Supabase (auth, metadata, RLS) + provider adapters (Google Drive, OneDrive). All file binaries live in providers; the app stores metadata and routes access.

---

## Current MVP Status

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Auth | ✓ | Sign up, sign in, sign out, session, user, 401 |
| 2 — DB Foundation | ✓ | Schema, RLS, migrations |
| 3 — Linked Accounts | ✓ | List, link, unlink, set active |
| 4 — OAuth/Token | ✓ | GDrive, OneDrive connect, token lifecycle |
| 5 — Upload Dispatch | ✓ | Dispatch, routing reason |
| 6 — Real Upload | ✓ | GDrive, OneDrive upload, metadata persistence |
| 7 — Metadata CRUD | ✓ | Folder/file create, rename, move, delete, restore |
| 8 — Unified Explorer | ✓ | Folder tree, file list, detail, provider badge, preview status |
| 9 — Download/Stream | ✓ | App-layer download, stream, permission enforcement |
| 10 — Preview Status | Partial | Display only, no job creation |
| 11 — Share | ✗ | Not implemented |
| 12 — Search | Partial | Basic filter in file list |
| 13 — Trash | Partial | Soft delete only, no trash list UI |
| 14 — Activity Logging | Partial | Logging in execute, dispatch, metadata, file-access |
| 15 — Hardening | ✓ | Env validation, error taxonomy, QA runbook |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth & DB:** Supabase (auth, Postgres, RLS)
- **Storage backends:** Google Drive, OneDrive (via provider APIs)
- **Styling:** Tailwind CSS, shadcn/ui
- **Validation:** Zod

---

## Cursor / MCP

For Cursor MCP (e.g. Stitch), see [.cursor/README.md](.cursor/README.md). Copy `.cursor/mcp.json.example` to `.cursor/mcp.json` and set your API key; do not commit `mcp.json`.

---

## Project Structure

```
rawvault/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # Sign in, sign up, sign out, session, user
│   │   ├── files/              # List, detail, download, stream, restore
│   │   ├── folders/            # List, create, rename, move, delete, restore, breadcrumb
│   │   ├── storage/accounts/   # List, connect, callback, link, set-active, unlink
│   │   └── uploads/            # Dispatch, execute
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── account-management/     # Linked accounts UI
│   ├── auth/                   # Auth testing section
│   └── explorer/               # Folder tree, file list, detail panel, upload
├── lib/
│   ├── api/                    # Errors, responses, request helpers
│   ├── auth/                   # Auth service, require-user
│   ├── contracts/              # Zod schemas and types
│   ├── env/                    # Env validation
│   ├── explorer/               # Folder/file listing service
│   ├── file-access/            # Download/stream service + provider adapters
│   ├── metadata/               # Folder/file CRUD service
│   ├── storage-accounts/       # Account + OAuth service
│   ├── supabase/               # Server client, admin
│   └── uploads/                # Dispatch, execute, provider upload adapters
├── scripts/
│   ├── seed-slice2-dev.mjs     # QA seed + linked accounts + folders + files
│   ├── verify-authenticated-slice2.mjs
│   ├── verify-phase8-explorer.mjs
│   ├── verify-phase9-download.mjs
│   └── verify-upload-download-txt.mjs
├── supabase/
│   └── migrations/             # Schema, RLS, indexes, Phase 4 token lifecycle
├── ENV_VALIDATION_REQUIREMENTS.md
├── ERROR_TAXONOMY.md
├── MVP_HARDENING_CHECKLIST.md
├── MVP_QA_RUNBOOK.md
├── MVP_GO_NO_GO_REPORT.md
└── PROVIDER_LIVE_VERIFICATION.md
```

---

## Environment Setup

### Required at Startup

Create `.env.local` in the project root:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon/publishable key |
| `RAWVAULT_TOKEN_ENCRYPTION_KEY` | 32-byte key (base64 or hex) for encrypting provider tokens |

Missing vars cause the server to fail at startup with `SERVER_MISCONFIGURED`.

### Required for OAuth (Live Provider Flows)

| Variable | Provider |
|----------|----------|
| `RAWVAULT_GDRIVE_CLIENT_ID` | Google Drive |
| `RAWVAULT_GDRIVE_CLIENT_SECRET` | Google Drive |
| `RAWVAULT_GDRIVE_OAUTH_CALLBACK_URL` | Must end with `/api/storage/accounts/connect/callback` |
| `RAWVAULT_ONEDRIVE_CLIENT_ID` | OneDrive |
| `RAWVAULT_ONEDRIVE_CLIENT_SECRET` | OneDrive |
| `RAWVAULT_ONEDRIVE_OAUTH_CALLBACK_URL` | Same path as above |
| `RAWVAULT_OAUTH_STATE_SECRET` | 32-byte for OAuth state encryption |

### Optional / QA

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Seed script, admin operations |
| `RAWVAULT_SEED_ALLOW` | Allow seed script |
| `RAWVAULT_SEED_ALLOW_REMOTE` | Allow seed to remote Supabase |
| `RAWVAULT_SEED_PROJECT_REF` | Target Supabase project ref for remote seed |
| `RAWVAULT_QA_EMAIL` | QA sign-in fallback |
| `RAWVAULT_QA_PASSWORD` | QA sign-in fallback |
| `RAWVAULT_BASE_URL` | QA script base URL (default: http://localhost:3000) |

**Full reference:** [ENV_VALIDATION_REQUIREMENTS.md](./ENV_VALIDATION_REQUIREMENTS.md)

---

## Local Development Setup

### 1. Prerequisites

- Node.js 18+
- Supabase project
- (Optional) Google Cloud + Azure app registrations for live provider flows

### 2. Install

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env.local` if present, or create `.env.local` with at least:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RAWVAULT_TOKEN_ENCRYPTION_KEY=your-32-byte-key-base64-or-hex
```

### 4. Database Migrations

Apply migrations to your Supabase project:

```bash
supabase db push
```

Or run migrations manually in the Supabase SQL editor. Files in `supabase/migrations/`:

- `20260313000100_foundation_slice_schema.sql` — Core tables
- `20260313000200_slice2_dispatch_and_explorer_indexes.sql` — Indexes
- `20260313000300_phase2_preview_jobs_foundation.sql` — Preview jobs
- `20260313000400_phase4_provider_oauth_token_lifecycle.sql` — Token columns (required for download/stream)

**Important:** Phase 4 migrations add `token_invalid_at` and related columns. Without them, download/stream will fail with `TOKEN_LOAD_FAILED`.

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Seed Data and Local QA Setup

For deterministic QA without live provider accounts:

### 1. Add Seed Env Vars to `.env.local`

```
RAWVAULT_SEED_ALLOW=true
RAWVAULT_SEED_ALLOW_REMOTE=true
RAWVAULT_SEED_PROJECT_REF=your-supabase-project-ref
```

### 2. Run Seed

```bash
npm run seed:slice2:dev
```

On Windows, if the npm script fails due to env vars, run:

```bash
node --env-file=.env.local scripts/seed-slice2-dev.mjs seed
```

**Note:** Ensure `.env.local` has `RAWVAULT_SEED_ALLOW=true` and `RAWVAULT_SEED_ALLOW_REMOTE=true` (and `RAWVAULT_SEED_PROJECT_REF` for remote targets).

### 3. Seed Output

Creates:
- QA user: `qa+slice2@rawvault.local` / `RawVault123!`
- 2 linked accounts (GDrive, OneDrive — scaffold only, no real tokens)
- 3 folders
- 4 files

---

## How the Main Flows Work

### Auth Flow

1. User signs up or signs in via `/api/auth/signup` or `/api/auth/signin`
2. Supabase sets session cookies
3. Protected routes call `requireAuthenticatedUser(supabase)` → 401 if no session
4. Session and user available via `/api/auth/session` and `/api/auth/user`

### Linked Account Flow

1. User clicks "Connect Google Drive" or "Connect OneDrive"
2. App → `/api/storage/accounts/connect?provider=gdrive` → redirects to provider OAuth
3. Provider redirects to `/api/storage/accounts/connect/callback` with code
4. App exchanges code for tokens, encrypts, stores in `linked_accounts`
5. Tokens never returned to client; only account metadata (provider, email, quota) shown

### Upload Flow

1. **Dispatch:** Client POSTs to `/api/uploads/dispatch` with file metadata (name, size, mime, folderId)
2. Service selects account by quota, preferred provider, fallback
3. Returns `dispatch` with `provider`, `storageAccountId`, `routingReason`
4. **Execute:** Client POSTs multipart to `/api/uploads/execute` with dispatch result + file body
5. Service gets token, uploads to provider (GDrive or OneDrive), returns provider file ID
6. **Metadata:** Only after provider success, inserts row into `files` with `provider_file_id_original`
7. Failure at any step → no partial success; metadata never written before provider success

### Metadata Flow

- **Folders:** Create, rename, move, soft delete, restore via `/api/folders` and `/api/folders/[id]`
- **Files:** Rename, move, soft delete, restore via `/api/files/[id]`
- All mutations enforce ownership (`user_id`), cycle prevention in moves, name conflict handling

### Explorer Flow

1. **Folders:** `GET /api/folders` (optional `parentId`) → list of folders
2. **Files:** `GET /api/files` (optional `folderId`, `search`, `provider`, `previewStatus`, `sortBy`, `sortOrder`) → list of files
3. **File detail:** `GET /api/files/[id]` → single file with provider, preview status, etc.
4. UI builds folder tree client-side; file list shows provider badge and preview status per file

### Download/Stream Flow

1. User clicks Download (or opens stream URL)
2. `GET /api/files/[id]/download` or `GET /api/files/[id]/stream`
3. Service: resolve file → check ownership → get token for `storage_account_id` → call provider adapter
4. GDrive: `GET https://www.googleapis.com/drive/v3/files/{id}?alt=media`
5. OneDrive: `GET https://graph.microsoft.com/v1.0/me/drive/items/{id}/content`
6. Response: `Content-Disposition: attachment` (download) or `inline` (stream), body streamed from provider
7. Tokens never exposed; all access via app layer

---

## Frontend Surfaces Currently Available

The main page (`/`) includes:

1. **Auth testing section** — Sign up, sign in, sign out, session status, user info. Use this first to establish a session before exercising authenticated features.

2. **Account management section** — List linked accounts, connect Google Drive/OneDrive, set active account, unlink. Provider badges and quota display.

3. **Unified explorer** — Folder tree (create, rename, move, delete), file list (rename, move, delete; provider badge; preview status), file detail panel (metadata, Download link). Search, provider filter, preview status filter, sort controls.

4. **Upload dispatch prep section** — Upload UI: select file, dispatch, execute. Shows routing reason and upload result.

**UI state handling:** Loading skeletons, error alerts with retry, empty states, action loading indicators. Destructive actions (delete) use `window.confirm`.

**Deferred:** Trash list UI, share UI, activity log UI, advanced search UI.

---

## Testing and Verification

### Deterministic Scripts

| Script | Command | Covers |
|--------|---------|--------|
| Auth + Explorer + Dispatch | `npm run qa:verify-auth-slice2` | Sign-in, folders, files, file detail, dispatch |
| Phase 8 Explorer | `npm run qa:verify-phase8-explorer` | Folders, files, detail, provider badge, preview status |
| Phase 9 Download | `npm run qa:verify-phase9-download` | Download, stream, 401, 404 |
| Upload + Download txt | `npm run qa:verify-upload-download-txt` | Upload .txt to Drive via app, then download and verify body |

**Prerequisites:** Dev server running, `.env.local` for scripts that use `--env-file=.env.local`. For Phase 8/9 and upload-download: an account with linked Google Drive gives full pass (set `RAWVAULT_QA_EMAIL`, `RAWVAULT_QA_PASSWORD`). Node 20+ for `qa:verify-upload-download-txt` (File API).

**Run order:** Seed → Dev server → Scripts

**Note:** `qa:verify-auth-slice2` may need `RAWVAULT_QA_ALLOW_SIGNIN_FALLBACK=true` if the seeded-signin route is not enabled. Set `RAWVAULT_BASE_URL` if the dev server runs on a different port (e.g. 3001).

### Manual Provider Checks

For live Google Drive and OneDrive flows:

1. Configure OAuth apps (Google Cloud, Azure)
2. Set `RAWVAULT_GDRIVE_*`, `RAWVAULT_ONEDRIVE_*`, `RAWVAULT_OAUTH_STATE_SECRET`
3. Follow [PROVIDER_LIVE_VERIFICATION.md](./PROVIDER_LIVE_VERIFICATION.md)

### Recommended Smoke Test Order

1. Sign in via Auth testing section
2. Browse folders and files in Explorer
3. Create a folder, rename a file
4. (Optional) Connect provider, upload file, download file
5. Run deterministic scripts

---

## Troubleshooting

### Server fails to start with SERVER_MISCONFIGURED

- Ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key), and `RAWVAULT_TOKEN_ENCRYPTION_KEY` are set in `.env.local`
- See [ENV_VALIDATION_REQUIREMENTS.md](./ENV_VALIDATION_REQUIREMENTS.md)

### Download/stream returns 500 TOKEN_LOAD_FAILED

- Phase 4 migrations not applied. Run `supabase db push` or apply `20260313000400_phase4_provider_oauth_token_lifecycle.sql` manually
- The `linked_accounts` table must have `token_invalid_at`, `token_invalid_reason`, etc.

### QA scripts fail with 401 or 500

- Ensure dev server is running
- Ensure seed has been run (creates QA user and data)
- For `qa:verify-auth-slice2`: use `RAWVAULT_QA_ALLOW_SIGNIN_FALLBACK=true` if seeded-signin is not configured
- For `qa:verify-phase8-explorer` and `qa:verify-phase9-download`: set `RAWVAULT_BASE_URL` if the server is on a port other than 3000

### Seed script refuses to run

- Set `RAWVAULT_SEED_ALLOW=true` in `.env.local`
- For remote Supabase: set `RAWVAULT_SEED_ALLOW_REMOTE=true` and `RAWVAULT_SEED_PROJECT_REF` (your project ref)

### OAuth connect fails

- **Error 400: redirect_uri_mismatch** — URL trong `.env.local` phải **trùng chính xác** với **Authorized redirect URI** trong Google Cloud Console. Port phải đúng với port app đang chạy (mặc định 3000). Chi tiết: [docs/GOOGLE_DRIVE_SETUP.md](docs/GOOGLE_DRIVE_SETUP.md#8-xử-lý-lỗi-thường-gặp).
- Ensure `RAWVAULT_GDRIVE_OAUTH_CALLBACK_URL` (or OneDrive) matches exactly: `https://your-domain/api/storage/accounts/connect/callback`
- For localhost: `http://localhost:3000/api/storage/accounts/connect/callback` (đổi port nếu chạy khác, ví dụ 3002)
- Env vars for client ID, secret, and state secret must be set

---

## Handoff Notes / Known Limitations

- **Share:** Not implemented. No share links, no public access.
- **Trash list:** Soft delete works; no dedicated trash list UI.
- **Preview jobs:** Preview status is displayed; no job creation or retry.
- **Activity log UI:** Logging exists; no UI to view logs.
- **Search:** Basic filter in file list (name, provider, preview status); no global search.
- **Phase 4 migrations:** Required for download/stream. Apply before handoff.
- **ESLint:** Pre-existing config issue; build passes.

**Full reference:** [MVP_GO_NO_GO_REPORT.md](./MVP_GO_NO_GO_REPORT.md), [MVP_QA_RUNBOOK.md](./MVP_QA_RUNBOOK.md)
