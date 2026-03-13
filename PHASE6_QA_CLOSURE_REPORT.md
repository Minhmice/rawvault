# Phase 6 QA Closure Report — RawVault Real Provider Upload Execution

**Date:** 2025-03-13  
**QA Role:** Phase 6 closure verification  
**Route under test:** `POST /api/uploads/execute`

---

## 1. Validation Results

### 1.1 Lint

| Check | Result |
|-------|--------|
| `npm run lint` | **PASS** |

ESLint completed with no errors or warnings. (Verified 2025-03-13.)

---

### 1.2 Build

| Check | Result |
|-------|--------|
| `npm run build` | **PASS** |

Next.js 16.1.6 (Turbopack) build completed successfully. Route `POST /api/uploads/execute` is present in the build manifest. (Verified 2025-03-13.)

---

### 1.3 Upload Flow — How to Test

#### Route

- **Method:** `POST`
- **Path:** `/api/uploads/execute`
- **Content-Type:** `multipart/form-data`

#### Required form fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | File | Yes | Binary file part |
| `fileName` | string | No | Falls back to `file.name` if omitted; must be non-empty after trim |
| `sizeBytes` | string (numeric) | No | Falls back to `file.size`; must match actual file size if provided |
| `mime` | string | No | MIME type |
| `folderId` | UUID | No | Target folder |
| `preferredProvider` | `"gdrive"` \| `"onedrive"` | No | Routing hint |
| `preferredAccountId` | UUID | No | Specific account hint |

#### Constraints

- Max file size: **50 MB**
- `sizeBytes` (if provided) must equal actual file byte length (SIZE_MISMATCH otherwise)
- `fileName` must be non-empty after trim (defaults to `"unnamed"` if empty)

---

#### Option A: curl (multipart)

**Success (authenticated, valid request):**

```bash
# 1. Obtain session cookie (sign in via UI or /api/auth/dev/seeded-signin)
# 2. Create a small test file
echo "test content" > /tmp/test-upload.txt
SIZE=$(wc -c < /tmp/test-upload.txt)

# 3. Call execute with session cookie (from browser DevTools after sign-in)
curl -X POST http://localhost:3000/api/uploads/execute \
  -H "Accept: application/json" \
  -b "sb-<project-ref>-auth-token=<your-session-cookie>" \
  -F "file=@/tmp/test-upload.txt" \
  -F "fileName=test-upload.txt" \
  -F "sizeBytes=$SIZE"
```

**Expected success response (201):**

```json
{
  "success": true,
  "file": {
    "id": "<uuid>",
    "name": "test-upload.txt",
    "provider": "gdrive" | "onedrive",
    "storageAccountId": "<uuid>",
    "providerFileId": "<provider-id>",
    "sizeBytes": 13,
    "createdAt": "<ISO datetime>",
    "updatedAt": "<ISO datetime>"
  }
}
```

**401 Unauthenticated:**

```bash
curl -X POST http://localhost:3000/api/uploads/execute \
  -H "Accept: application/json" \
  -F "file=@/tmp/test-upload.txt" \
  -F "fileName=test-upload.txt" \
  -F "sizeBytes=13"
```

**Expected 401 response:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required."
  }
}
```

**Validation error examples:**

| Scenario | Expected status | Expected code |
|----------|-----------------|---------------|
| Missing `file` part | 400 | VALIDATION_ERROR |
| Wrong Content-Type (e.g. JSON) | 400 | VALIDATION_ERROR |
| `sizeBytes` ≠ actual file size | 400 | SIZE_MISMATCH |
| File > 50 MB | 400 | FILE_TOO_LARGE |
| Invalid `folderId` format | 400 | VALIDATION_ERROR |
| Empty `fileName` (after fallback) | 400 | VALIDATION_ERROR |

---

#### Option B: UI

1. Start dev server: `npm run dev`
2. Sign in via **Auth testing** (or seeded-signin)
3. Ensure at least one linked Google Drive and one OneDrive account
4. Go to **Upload dispatch prep** section
5. Fill form: fileName, sizeBytes, optional mime/folderId/preferredProvider
6. Select a file via file picker
7. Click **Execute upload**

**Expected:** Success shows file id, name, provider; errors show in UI.

---

### 1.4 Expected Behavior Summary

| Scenario | HTTP | Code | Message (typical) |
|----------|------|------|-------------------|
| Success | 201 | — | — |
| Unauthenticated | 401 | UNAUTHORIZED | Authentication is required. |
| Missing/invalid file | 400 | VALIDATION_ERROR | Missing or invalid file part. |
| Wrong Content-Type | 400 | VALIDATION_ERROR | Content-Type must be multipart/form-data... |
| Size mismatch | 400 | SIZE_MISMATCH | Declared size does not match actual file size. |
| File too large | 400 | FILE_TOO_LARGE | File exceeds maximum upload size... |
| No linked accounts | 400 | NO_LINKED_ACCOUNTS | (from dispatch) |
| No eligible account | 400 | NO_ELIGIBLE_ACCOUNT | (from dispatch) |
| Token expired / reauth | 401/403 | TOKEN_EXPIRED / REAUTH_REQUIRED | (from provider adapter) |

---

## 2. Manual Verification Checklist

Copy-paste checklist for live provider verification:

```
Phase 6 Manual Verification Checklist
====================================

Environment
-----------
[ ] RAWVAULT_GDRIVE_CLIENT_ID set
[ ] RAWVAULT_GDRIVE_CLIENT_SECRET set
[ ] RAWVAULT_GDRIVE_OAUTH_CALLBACK_URL set (absolute URL, path /api/storage/accounts/connect/callback)
[ ] RAWVAULT_ONEDRIVE_CLIENT_ID set
[ ] RAWVAULT_ONEDRIVE_CLIENT_SECRET set
[ ] RAWVAULT_ONEDRIVE_OAUTH_CALLBACK_URL set (absolute URL, path /api/storage/accounts/connect/callback)
[ ] RAWVAULT_OAUTH_STATE_SECRET set (min 32 chars)
[ ] RAWVAULT_TOKEN_ENCRYPTION_KEY set (base64 or hex, decodes to 32 bytes)

Database
--------
[ ] Migration 20260313000400_phase4_provider_oauth_token_lifecycle.sql applied

Linked Accounts
---------------
[ ] At least one Google Drive account linked (OAuth flow completed)
[ ] At least one OneDrive account linked (OAuth flow completed)

Upload Execution
----------------
[ ] Authenticated upload to Google Drive succeeds (file visible in Drive)
[ ] Authenticated upload to OneDrive succeeds (file visible in OneDrive)
[ ] Unauthenticated request returns 401
[ ] Invalid/missing file returns 400 VALIDATION_ERROR
[ ] Size mismatch returns 400 SIZE_MISMATCH
[ ] File > 50 MB returns 400 FILE_TOO_LARGE
[ ] Metadata persisted correctly (file row in DB with provider_file_id_original)
[ ] Activity log entry created for upload_executed
```

---

## 3. Blockers (if live verification cannot complete)

If live provider verification cannot be completed, the following are **exact blockers**:

| # | Blocker | Resolution |
|---|---------|------------|
| 1 | OAuth env not configured | Set GDRIVE/ONEDRIVE client ID, secret, callback URL; RAWVAULT_OAUTH_STATE_SECRET; RAWVAULT_TOKEN_ENCRYPTION_KEY |
| 2 | Phase 4 migration not applied | Run `supabase db push` or apply `supabase/migrations/20260313000400_phase4_provider_oauth_token_lifecycle.sql` |
| 3 | No linked Google Drive account | Complete OAuth connect flow for Google Drive |
| 4 | No linked OneDrive account | Complete OAuth connect flow for OneDrive |
| 5 | Provider app registration invalid | Verify redirect URIs, scopes, and app status in Google Cloud / Azure portals |
| 6 | Token encryption key invalid | RAWVAULT_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (base64 or hex) |

---

## 4. Go/No-Go Recommendation

### Deterministic checks: **PASS**

- Lint: **PASS**
- Build: **PASS**
- Route present: **yes** (`/api/uploads/execute`)
- Contract and error handling: aligned with PLAN.md / PHASE6_PLAN.md

### Live verification: **Requires manual run**

Live provider uploads (Google Drive, OneDrive) require:

- OAuth env configured
- Phase 4 migration applied
- At least one linked account per provider

### Recommendation

| Condition | Go | No-Go |
|-----------|----|-------|
| Lint + build pass | ✓ | |
| OAuth env configured | ✓ | |
| Phase 4 migration applied | ✓ | |
| At least 1 GDrive + 1 OneDrive linked | ✓ | |
| One successful upload per provider | ✓ | |
| 401/validation error paths verified | ✓ | |

**Go:** If all checklist items above are satisfied, Phase 6 can be closed.

**No-Go:** If any of the following remain:

- OAuth env missing or misconfigured
- Phase 4 migration not applied
- No linked Google Drive or OneDrive account
- No successful real upload to each provider
- 401 or validation error paths not verified

---

## 5. Summary

| Item | Status |
|------|--------|
| Lint | **PASS** |
| Build | **PASS** |
| Upload flow documented | Yes |
| Manual checklist | Copy-pasteable above |
| Blockers listed | Yes |
| Go/No-Go | **Go** if manual verification completes; **No-Go** until live uploads and auth/validation paths are verified |
