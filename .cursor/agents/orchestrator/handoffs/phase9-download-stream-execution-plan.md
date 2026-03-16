# Phase 9 — Download and Stream Layer: Execution Plan

**Purpose**: Verify and (if needed) fix the download/stream layer: permission before access, provider resolution, error normalization, and contracts. **Check first, then assign fixes.**

**References**:
- `PLAN.md` § Phase 9 (Goal, Objectives, Functional scope, Deliverables, Done criteria)
- `docs/PLAN-remediation-execution.md` Bước 5 (Phase 9: Download + stream — permission check before calling provider; error normalization)
- `docs/SLICE_STATUS.md` Phase 9 row
- `.cursor/agents/orchestrator/SKILL.md`, `task-to-agent-mapping-rules.md`

---

## 1. Goal & Done Criteria (Phase 9)

**Goal**: Allow users to retrieve file content from the correct provider through the app layer.

**Done criteria** (PLAN):
- User can download a file via app route.
- User can stream supported content via app route.
- File access always uses the correct provider/account.
- Unauthorized access is blocked consistently.

**Deliverables** (PLAN Phase 9):
- Provider download/stream adapters
- File access service
- Download route
- Stream route
- Permission enforcement
- Basic access log entry

**Functional scope** (checklist for audit):
- Download endpoint: GET /api/files/[id]/download — attachment disposition, stream body
- Stream endpoint: GET /api/files/[id]/stream — inline disposition, stream body
- Permission: Require auth before resolving file; resolve file by id + user_id (ownership); 401 when unauthenticated; 404 when file missing or not owned or deleted
- Provider resolution: File metadata → storage_provider, storage_account_id, provider_file_id_original; token for that account
- Adapters: GDrive and OneDrive download (stream body, content-type, content-length when known)
- Error normalization: FILE_NOT_FOUND, ACCOUNT_NOT_FOUND, token errors (TOKEN_INVALID, etc.), provider errors; responses use contract error shape (code, message)
- Access log: activity_logs entry on successful file access (e.g. file_access action)

---

## 2. Overview — Order of Work (4 stages)

| Stage | Purpose | Who | Parallel? | Output |
|-------|---------|-----|-----------|--------|
| **Stage 1 — Audit** | Read file-access routes, service, adapters, contracts; no code changes; produce gap report | backend-developer | — | `docs/phase9-download-stream-audit-backend.md` |
| **Stage 2 — Orchestrator** | Read audit → fix list → handoff for Stage 3 if gaps | Orchestrator | — | Fix list + handoff Stage 3 |
| **Stage 3 — Fix** | Implement fixes per fix list (only when gaps exist) | backend-developer | — | Code changes |
| **Stage 4 — Review & QA** | Review file-access layer; run Phase 9 verification script | code-reviewer + qa-tester | **Yes** | Review report + QA report |

**Principle**: Stage 1 is read-only. Phase 9 is backend-only (no frontend audit). Stage 3 runs only after Stage 2 fix list.

---

## 3. Stage 1 — Audit (Check First)

### 3.1 Conditions

- **Backend audit** (one agent): download route, stream route, file-access service (resolve, permission, token, adapter), adapters (gdrive, onedrive), file-access contracts (error codes); permission before access; error normalization.
- **Start Stage 1**: Orchestrator calls backend-developer with audit-only prompt (or performs audit and writes report).
- **End Stage 1**: Have `docs/phase9-download-stream-audit-backend.md`. Orchestrator builds fix list.

### 3.2 Backend-developer — Audit (read-only)

**Tasks**:

1. **File-access contracts**
   - Read `lib/contracts/file-access.contracts.ts`. List: fileAccessErrorCodeSchema (FILE_NOT_FOUND, UNAUTHORIZED, ACCOUNT_NOT_FOUND, TOKEN_*, PROVIDER_*, INTERNAL_SERVER_ERROR); fileAccessErrorResponseSchema (success: false, error: { code, message }).
   - Check: When routes return error (401, 404, 400, 500), does handleRouteError produce a response that matches or is consistent with fileAccessErrorResponseSchema (code, message)?

2. **Routes**
   - `GET /api/files/[id]/download`: Protected (requireAuthenticatedUser)? Calls accessFileContent(supabase, user.id, id)? Response: 200 + body stream + Content-Type, Content-Disposition attachment, Content-Length when known? On error, handleRouteError (so 401 from auth, 404/400/500 from service)?
   - `GET /api/files/[id]/stream`: Same as download but Content-Disposition inline? Same permission and service flow?

3. **File-access service**
   - `resolveFileForAccess(supabase, userId, fileId)`: Validates id (fileIdParamsSchema)? Selects file by id + user_id; .maybeSingle(). If no row or deleted_at set → 404 FILE_NOT_FOUND? If storage_account_id null → 400 ACCOUNT_NOT_FOUND? Returns provider, storageAccountId, providerFileId, name, mime, sizeBytes.
   - `accessFileContent`: Calls resolveFileForAccess first (permission/ownership); then getUsableProviderToken(supabase, userId, storageAccountId); then adapter (gdrive vs onedrive) with accessToken, providerFileId. On success: activity_logs insert (file_access)? On adapter/token failure: rethrow; if token/auth error, markAccountTokenInvalid? Errors: ApiError with code/status so handleRouteError returns correct status and body.

4. **Adapters**
   - `lib/file-access/adapters/gdrive.download.ts`: Accepts accessToken, providerFileId, mimeType? Returns body (ReadableStream), contentType, contentLength? Throws ApiError with appropriate code (e.g. PROVIDER_RESOURCE_NOT_FOUND, PROVIDER_ACCESS_FAILED) on provider errors?
   - `lib/file-access/adapters/onedrive.download.ts`: Same pattern for OneDrive.

5. **Permission and error normalization**
   - Permission: Auth required in both routes before any file resolution. resolveFileForAccess filters by user_id → no access to other users’ files. 401 when not authenticated (from requireAuthenticatedUser).
   - 404: Missing file, not-owned file, or deleted file → FILE_NOT_FOUND.
   - 400: File has no linked account → ACCOUNT_NOT_FOUND.
   - Token errors from getUsableProviderToken (e.g. TOKEN_INVALID, TOKEN_EXPIRED) → appropriate status and code.
   - Provider errors from adapters → mapped to contract codes where possible (PROVIDER_RESOURCE_NOT_FOUND, PROVIDER_ACCESS_FAILED).

6. **Output**
   - Report: (a) Table Route | Protected? | Service call? | Disposition? | Error handling? | Gaps. (b) Service: resolveFileForAccess (ownership, 404, ACCOUNT_NOT_FOUND); accessFileContent (token, adapter, activity log, error propagation). (c) Adapters: GDrive/OneDrive inputs and outputs; error throwing. (d) List of gaps (permission too late, missing 404/401, error shape not aligned with fileAccessErrorResponseSchema, missing activity log, etc.). (e) Conclusion: "pass" or "needs fix" + files to fix.
   - **ScopeIn**: `app/api/files/[id]/download/route.ts`, `app/api/files/[id]/stream/route.ts`, `lib/file-access/service.ts`, `lib/file-access/adapters/gdrive.download.ts`, `lib/file-access/adapters/onedrive.download.ts`, `lib/contracts/file-access.contracts.ts`, `lib/api/responses.ts` (handleRouteError), `lib/auth/require-user.ts`.
   - **ScopeOut**: No code changes. No share-layer file access (separate flow). Read-only; write report only.
   - **Output artifact**: `docs/phase9-download-stream-audit-backend.md`

### 3.3 Orchestrator after Stage 1

- Read `docs/phase9-download-stream-audit-backend.md`.
- Build **Fix list** (permission, error codes, activity log, adapter errors, etc.) with file paths.
- If **no gaps**: Update SLICE_STATUS Phase 9 note to "Verified"; proceed to Stage 4 (review + QA).
- If **gaps exist**: Write handoff for Stage 3 and call backend-developer.

---

## 4. Stage 2 — Orchestrator: Fix List & Assignment

**Input**: Backend audit report.

**Orchestrator**:
1. **Fix list**: Each item with file(s) and brief requirement (e.g. "Ensure 404 response body matches fileAccessErrorResponseSchema when FILE_NOT_FOUND").
2. **Handoff** for Stage 3: Scope (download/stream routes, file-access service, adapters, contracts). Required items from fix list. Non-goals: no new endpoints; no share flow changes.
3. Run Stage 3 only if fix list non-empty.

---

## 5. Stage 3 — Fix (Implementation)

**Condition**: Fix list from Stage 2 exists and is non-empty.

### 5.1 Backend-developer — Fix

- Scope: `app/api/files/[id]/download/route.ts`, `app/api/files/[id]/stream/route.ts`, `lib/file-access/service.ts`, `lib/file-access/adapters/gdrive.download.ts`, `lib/file-access/adapters/onedrive.download.ts`, `lib/contracts/file-access.contracts.ts` (if needed).
- Required: Per fix list (permission before access, 401/404/400/500, error shape, activity log, adapter error mapping).
- Do not: Change share file-access flow; add new routes unless in fix list.

### 5.2 After Stage 3

- Merge code. Prepare for Stage 4.

---

## 6. Stage 4 — Review & QA

### 6.1 Code-reviewer

- Scope: Phase 9 download/stream (routes, file-access service, adapters, contracts).
- Check: (1) Both routes protected; permission (resolve by user_id) before token/adapter. (2) 401 unauthenticated, 404 missing/not-owned/deleted, 400 no account. (3) Error responses consistent with file-access error contract. (4) Success path logs file_access. (5) Adapters return stream + contentType/contentLength; throw with appropriate codes.

### 6.2 QA-tester

- Acceptance: (1) User can download a file via app route (200, attachment, body). (2) User can stream via app route (200, inline, body). (3) Unauthorized access blocked (401 without session). (4) Not-found: 404 for non-existent file id.
- Run: `npm run qa:verify-phase9-download` (or `node scripts/verify-phase9-download.mjs` with env).
- Output: Pass/fail per criterion; manual steps if needed; regression risks.

### 6.3 After Stage 4

- Summarize; update SLICE_STATUS Phase 9 note (e.g. "Verified; permission before access, error normalization confirmed" or "Verified after fixes").
- Next: Phase 10 (Preview status) or Bước 6 (Phase 10–12) per `docs/PLAN-remediation-execution.md`.

---

## 7. Agent Order Table

| Step | Agent | Action | Start condition | In parallel with |
|------|--------|--------|------------------|-------------------|
| 1 | backend-developer | Audit: download/stream routes, file-access service, adapters, contracts → `docs/phase9-download-stream-audit-backend.md` | Orchestrator request | — |
| 2 | orchestrator | Read audit → fix list → handoff Stage 3 | Audit file exists | — |
| 3 | backend-developer | Fix per fix list (if any) | Handoff from Stage 2 | — |
| 4a | code-reviewer | Review Phase 9 (file-access BE) | Stage 3 merged or audit-only | qa-tester (4b) |
| 4b | qa-tester | QA: download, stream, 401, 404; run verify-phase9-download | Stage 3 merged or audit-only | code-reviewer (4a) |

---

## 8. Sample Prompts for Each Agent

### 8.1 Stage 1 — Backend audit

```
Act as backend-developer per .cursor/agents/specialists/backend-developer/SKILL.md.

Task: Phase 9 Download and Stream Layer — BACKEND AUDIT ONLY (read-only; do not change code). Repo: [workspace path].

1. Contracts: Read lib/contracts/file-access.contracts.ts. List fileAccessErrorCodeSchema, fileAccessErrorResponseSchema. When routes return 401/404/400/500, does handleRouteError produce a body consistent with error code + message?

2. Routes: GET /api/files/[id]/download and GET /api/files/[id]/stream. For each: protected (requireAuthenticatedUser)? Call accessFileContent(supabase, user.id, id)? Response: 200 + stream, Content-Type, Content-Disposition (attachment vs inline), Content-Length when known? Errors via handleRouteError?

3. File-access service lib/file-access/service.ts: resolveFileForAccess(supabase, userId, fileId) — filter by user_id, maybeSingle; 404 if no row or deleted_at; 400 if storage_account_id null. accessFileContent: resolve first, then getUsableProviderToken, then adapter (gdrive/onedrive). On success: activity_logs insert file_access? On token/adapter error: rethrow; token auth errors trigger markAccountTokenInvalid? All errors ApiError with code/status?

4. Adapters: gdrive.download.ts, onedrive.download.ts. Inputs (accessToken, providerFileId, mimeType?); output body, contentType, contentLength? On provider failure throw ApiError with appropriate code (e.g. PROVIDER_RESOURCE_NOT_FOUND, PROVIDER_ACCESS_FAILED)?

5. Permission: Auth required before any file resolution. resolveFileForAccess enforces ownership. 401 unauthenticated, 404 missing/not-owned/deleted, 400 no linked account.

6. Output: Write docs/phase9-download-stream-audit-backend.md with: (a) Route table: Protected? Service? Disposition? Error handling? Gaps. (b) Service: resolve, accessFileContent, activity log, error propagation. (c) Adapters: in/out, errors. (d) Gaps list. (e) Conclusion: "pass" or "needs fix" + files to fix. No code changes. Create the file in the workspace.
```

### 8.2 Stage 3 — Backend fix (fill fix list from Stage 2)

```
Act as backend-developer per .cursor/agents/specialists/backend-developer/SKILL.md.

Task: Phase 9 Download and Stream Layer — IMPLEMENT FIXES.

[Orchestrator: paste fix list from Stage 2.]

Scope: app/api/files/[id]/download/route.ts, app/api/files/[id]/stream/route.ts, lib/file-access/service.ts, lib/file-access/adapters/gdrive.download.ts, lib/file-access/adapters/onedrive.download.ts, lib/contracts/file-access.contracts.ts (if needed). Required: permission before access; 401/404/400/500 and error shape; activity log; adapter error mapping per list. Do not change share file-access flow.
```

### 8.3 Stage 4 — Code-reviewer

```
Act as code-reviewer per .cursor/agents/specialists/code-reviewer/SKILL.md.

Review Phase 9 Download and Stream Layer. Scope: [list changed files or "audit doc only"].

Check: (1) Both routes protected; resolve by user_id before token/adapter. (2) 401/404/400 correctly returned. (3) Error body consistent with file-access contract. (4) file_access activity log on success. (5) Adapters return stream + headers; throw with appropriate codes.

Output: Accept / Conditional accept + suggested fixes.
```

### 8.4 Stage 4 — QA-tester

```
Act as qa-tester per .cursor/agents/specialists/qa-tester/SKILL.md.

QA Phase 9 Download and Stream. Repo: [workspace path].

Acceptance: (1) Download via app route returns 200, attachment, body. (2) Stream via app route returns 200, inline, body. (3) Unauthorized blocked (401 without session). (4) 404 for non-existent file.

Run npm run qa:verify-phase9-download (or scripts/verify-phase9-download.mjs with .env.local). Output: Pass/fail per criterion; manual steps; regression risks.
```

---

## 9. Phase 9 Completion Checklist (Orchestrator)

- [x] Stage 1: Backend audit done; have `docs/phase9-download-stream-audit-backend.md`.
- [x] Stage 2: Read audit; built fix list; if gaps, wrote handoff for Stage 3.
- [x] Stage 3: If fix list non-empty — backend-developer fixes applied; code merged.
- [x] Stage 4: Code-reviewer and qa-tester (in parallel); received both outputs.
- [x] Done criteria Phase 9 (PLAN): download and stream via app; correct provider/account; unauthorized blocked.
- [x] Updated `docs/SLICE_STATUS.md` Phase 9 note.

When all items are checked, Phase 9 can be closed. Next: Phase 10 (Preview status) or Bước 6 per `docs/PLAN-remediation-execution.md`.
