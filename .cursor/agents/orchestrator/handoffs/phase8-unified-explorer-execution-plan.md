# Phase 8 — Unified Explorer: Execution Plan

**Purpose**: Verify and (if needed) fix the unified explorer: backend routes/service/contracts and frontend UI (FileGrid, loading/error/empty, provider badge, preview status). **Check first, then assign fixes.**

**References**:
- `PLAN.md` § Phase 8 (Goal, Objectives, Functional scope, Deliverables, Done criteria)
- `docs/PLAN-remediation-execution.md` Bước 5 (Phase 8: Explorer list + UI — loading/error/empty; provider badge; contract alignment)
- `docs/SLICE_STATUS.md` Phase 8 row
- `.cursor/agents/orchestrator/SKILL.md`, `task-to-agent-mapping-rules.md`

---

## 1. Goal & Done Criteria (Phase 8)

**Goal**: Present the user with one coherent library regardless of underlying provider.

**Done criteria** (PLAN):
- Users can browse folders and files.
- List data is canonical and stable.
- UI states are not misleading.
- Explorer reflects one unified library rather than provider-siloed views.

**Deliverables** (PLAN Phase 8):
- Explorer contracts
- Explorer service
- Explorer routes
- Unified explorer UI (file list, folder tree, controls)
- File detail fetch flow
- Loading/error/empty states
- Provider badge display
- Preview status display

**Functional scope** (checklist for audit):
- Folder navigation (list folders, by parentId)
- File listing (list files, folderId, sort, filter: provider, previewStatus)
- File detail (GET file by id)
- Provider badge (provider in list/detail response and UI)
- Preview status (previewStatus, errorCode in response and UI)
- Loading state (UI shows loading while fetching)
- Error state (UI shows error message; API returns 404 for missing file)
- Empty state (UI when no folders and no files)
- Contract alignment (BE response shapes match explorer contracts; FE consumes them correctly)

---

## 2. Overview — Order of Work (4 stages)

| Stage | Purpose | Who | Parallel? | Output |
|-------|---------|-----|-----------|--------|
| **Stage 1 — Audit** | Read backend (explorer service, routes, contracts) and frontend (FileGrid, VaultClient, states); no code changes; produce gap reports | backend-developer + frontend-developer | **Yes** (2 audits) | `docs/phase8-explorer-audit-backend.md`, `docs/phase8-explorer-audit-frontend.md` |
| **Stage 2 — Orchestrator** | Read both audits → single fix list → assignments | Orchestrator | — | Fix list + handoffs for Stage 3 |
| **Stage 3 — Fix** | Implement fixes per fix list (only when gaps exist) | backend-developer and/or frontend-developer | Per assignment | Code changes |
| **Stage 4 — Review & QA** | Review explorer (BE + FE) and run QA (browse, states, contract) | code-reviewer + qa-tester | **Yes** | Review report + QA report |

**Principle**: Stage 1 is read-only and produces reports. Stage 3 runs only after Stage 2 fix list; assign only the agents needed. Phase 8 spans both backend (explorer service, routes, contracts) and frontend (explorer UI, states).

---

## 3. Stage 1 — Audit (Check First)

### 3.1 Conditions

- **Backend audit** (one agent): explorer service, folders/files routes, explorer contracts, drive/browse route if used; response shapes; 404 for missing file.
- **Frontend audit** (one agent): FileGrid, VaultClient, loading/error/empty, provider badge, preview status; use of explorer API and contract types.
- **Start Stage 1**: Orchestrator calls 2 `mcp_task` (backend-developer, frontend-developer) with audit-only prompts.
- **End Stage 1**: Both `docs/phase8-explorer-audit-backend.md` and `docs/phase8-explorer-audit-frontend.md` exist. Orchestrator reads them and builds one fix list.

### 3.2 Backend-developer — Audit (read-only)

**Tasks**:

1. **Explorer contracts**
   - Read `lib/contracts/explorer.contracts.ts` and exports from `lib/contracts/index.ts`. List: listFoldersQuerySchema, listFoldersResponseSchema (explorerFolderSchema); listFilesQuerySchema, listFilesResponseSchema (explorerFileSchema); getFileResponseSchema; filePreviewStatusSchema, fileSortBySchema, sortOrderSchema.
   - Check: Folder list has parentId, name, path, createdAt, updatedAt. File list/detail has folderId, name, ext, mime, sizeBytes, **provider**, storageAccountId, **previewStatus**, syncStatus, errorCode, timestamps. Query: folderId, search, provider, previewStatus, sortBy, sortOrder.

2. **Explorer service**
   - `lib/explorer/service.ts`: listExplorerFolders, listExplorerFiles, getExplorerFile; parseFoldersQuery / parseFilesQuery (or equivalent).
   - Ownership: All ops filter by user (e.g. auth.uid()); exclude deleted (deleted_at is null) for normal list.
   - Response shape: Normalize to camelCase (parentId, folderId, previewStatus, etc.) and match listFoldersResponseSchema / listFilesResponseSchema / getFileResponseSchema. Provider field present (from storage_provider). Preview status and errorCode present.

3. **Routes**
   - `GET /api/folders` — query parentId? Protected? Returns listFoldersResponseSchema shape?
   - `GET /api/files` — query folderId, search, provider, previewStatus, sortBy, sortOrder? Protected? Returns listFilesResponseSchema shape?
   - `GET /api/files/[id]` — get file detail. Protected? Returns getFileResponseSchema? **404** for missing or not-owned file?
   - `GET /api/storage/drive/browse` (if used by explorer UI): driveBrowseQuerySchema, driveBrowseResponseSchema; when is it used vs unified list?

4. **Consistency**
   - List endpoints return canonical shapes (success, folders/files array, total). File detail returns success, file. No shadow DTOs; use contract types in service.

5. **Output**
   - Report: (a) Table Route | Method | Query/params | Contract? | Protected? | Service? | Gaps. (b) Service: list folders/files/get file — ownership? exclude deleted? response shape vs contract? (c) List of gaps (missing 404, wrong shape, missing provider/previewStatus, etc.). (d) Conclusion: "pass" or "needs fix" + files to fix.
   - **ScopeIn**: `app/api/folders/route.ts`, `app/api/files/route.ts`, `app/api/files/[id]/route.ts`, `app/api/storage/drive/browse/route.ts`, `lib/explorer/service.ts`, `lib/contracts/explorer.contracts.ts`, `lib/contracts/drive-browse.contracts.ts`, `lib/contracts/index.ts`.
   - **ScopeOut**: No code changes. No metadata routes (Phase 7). Read-only; write report only.
   - **Output artifact**: `docs/phase8-explorer-audit-backend.md`

### 3.3 Frontend-developer — Audit (read-only)

**Tasks**:

1. **Explorer UI entry**
   - `components/workspace/VaultClient.tsx`: How does it fetch folders and files (endpoints, query params)? Where does it pass data to FileGrid (folders, files, loading, error)?

2. **FileGrid**
   - `components/workspace/FileGrid.tsx`: Props (folders, files, loading, error). **Loading**: Is a loading state shown when `loading === true` (e.g. spinner + message)? **Error**: Is an error message shown when `error` is set? **Empty**: Is an empty state shown when !loading && !error && no folders && no files? Accessibility (e.g. role="alert" for error)?

3. **Provider badge**
   - Where is provider (e.g. "gdrive", "onedrive") displayed? File list item, file detail panel, or both? Does the UI use the same field name as the API (e.g. `file.provider`)?

4. **Preview status**
   - Where is preview status (pending/processing/ready/failed) or errorCode shown? Does the UI use the same field names as the API (previewStatus, errorCode)?

5. **Contract alignment**
   - Does the frontend expect list shapes (folders[], files[], total) and file detail shape (file) matching explorer contracts? Any mismatch (e.g. snake_case vs camelCase)?

6. **Output**
   - Report: (a) Table Component | Loading? | Error? | Empty? | Provider badge? | Preview status? | Gaps. (b) Data flow: VaultClient → FileGrid (props, API response usage). (c) List of gaps (missing loading/error/empty, misleading state, provider/preview not shown, contract mismatch). (d) Conclusion: "pass" or "needs fix" + files to fix.
   - **ScopeIn**: `components/workspace/VaultClient.tsx`, `components/workspace/FileGrid.tsx`, `components/workspace/DashboardLayout.tsx`, `components/workspace/VaultHeader.tsx`, `components/workspace/VaultFilterBar.tsx` (if they affect explorer list/state).
   - **ScopeOut**: No code changes. No Phase 7 metadata forms (create folder, rename, etc.). Read-only; write report only.
   - **Output artifact**: `docs/phase8-explorer-audit-frontend.md`

### 3.4 Orchestrator after Stage 1

- Read `docs/phase8-explorer-audit-backend.md` and `docs/phase8-explorer-audit-frontend.md`.
- Merge gaps into one **Fix list** (backend items + frontend items), each with file path and owner (backend-developer vs frontend-developer).
- If **no gaps**: Update SLICE_STATUS Phase 8 note to "Verified"; proceed to Stage 4 (review + QA).
- If **gaps exist**: Write handoffs for Stage 3 and call the relevant agent(s).

---

## 4. Stage 2 — Orchestrator: Fix List & Assignment

**Input**: Backend and frontend audit reports.

**Orchestrator**:
1. **Fix list**: Each item with file(s) and owner (e.g. "Ensure GET /api/files/[id] returns 404 for missing file" → backend-developer; "FileGrid empty state copy" → frontend-developer).
2. **Handoffs** for Stage 3: One for backend (scope: routes, explorer service, contracts), one for frontend (scope: VaultClient, FileGrid, states). Required items from fix list; non-goals (e.g. no Phase 7 metadata behavior change, no new API endpoints unless in fix list).
3. Decide to run Stage 3 for each owner that has fixes.

---

## 5. Stage 3 — Fix (Implementation)

**Condition**: Fix list from Stage 2 exists.

### 5.1 Backend-developer — Fix

- Scope: `app/api/folders/route.ts`, `app/api/files/route.ts`, `app/api/files/[id]/route.ts`, `app/api/storage/drive/browse/route.ts` (if in fix list), `lib/explorer/service.ts`, `lib/contracts/explorer.contracts.ts` (if needed).
- Required: Per backend fix list (e.g. 404 for missing file, response shape alignment, provider/previewStatus in response).
- Do not: Change explorer list contract shapes unless in fix list; change DB schema.

### 5.2 Frontend-developer — Fix

- Scope: `components/workspace/VaultClient.tsx`, `components/workspace/FileGrid.tsx`, and any component in fix list (e.g. VaultFilterBar for filter UI).
- Required: Per frontend fix list (e.g. loading/error/empty clearly shown, provider badge, preview status, contract alignment).
- Do not: Change API contracts; add new API endpoints.

### 5.3 After Stage 3

- Merge code. Prepare scope for Stage 4.

---

## 6. Stage 4 — Review & QA

### 6.1 Code-reviewer

- Scope: Phase 8 unified explorer (backend routes + explorer service + frontend FileGrid/VaultClient).
- Check: (1) Explorer API request/response match contracts. (2) All explorer routes protected. (3) 404 for missing file. (4) FileGrid receives and shows loading, error, empty. (5) Provider and preview status present in API and visible in UI where specified.

### 6.2 QA-tester

- Acceptance: (1) Users can browse folders and files (list folders, list files by folder, get file detail). (2) List data is canonical and stable (same shape, no drift). (3) UI states are not misleading (loading while fetch, error message on failure, empty when no items). (4) Explorer reflects one unified library (single list, provider badge, preview status).
- Run existing script if available: `npm run qa:verify-phase8-explorer` (or equivalent).
- Output: Pass/fail per criterion; manual steps; regression risks.

### 6.3 After Stage 4

- Summarize; update SLICE_STATUS Phase 8 note (e.g. "Verified; loading/error/empty and contract alignment confirmed" or "Verified after fixes").
- Next: Phase 9 (Download/Stream) or continue Bước 5 (Phase 7+8+9) per `docs/PLAN-remediation-execution.md`.

---

## 7. Agent Order Table

| Step | Agent | Action | Start condition | In parallel with |
|------|--------|--------|------------------|-------------------|
| 1a | backend-developer | Audit: explorer service, routes, contracts → `docs/phase8-explorer-audit-backend.md` | Orchestrator calls mcp_task | frontend-developer (1b) |
| 1b | frontend-developer | Audit: FileGrid, VaultClient, loading/error/empty, provider/preview → `docs/phase8-explorer-audit-frontend.md` | Orchestrator calls mcp_task | backend-developer (1a) |
| 2 | orchestrator | Read both audits → fix list → handoffs Stage 3 | Both audit files exist | — |
| 3a | backend-developer | Fix per backend fix list (if any) | Handoff from Stage 2 | Optional: 3b |
| 3b | frontend-developer | Fix per frontend fix list (if any) | Handoff from Stage 2 | Optional: 3a |
| 4a | code-reviewer | Review Phase 8 (explorer BE + FE) | Stage 3 merged or audit-only | qa-tester (4b) |
| 4b | qa-tester | QA: browse, states, contract; run verify-phase8-explorer | Stage 3 merged or audit-only | code-reviewer (4a) |

---

## 8. Sample Prompts for Each Agent

### 8.1 Stage 1 — Backend audit

```
Act as backend-developer per .cursor/agents/specialists/backend-developer/SKILL.md.

Task: Phase 8 Unified Explorer — BACKEND AUDIT ONLY (read-only; do not change code). Repo: [workspace path].

1. Contracts: Read lib/contracts/explorer.contracts.ts and lib/contracts/index.ts. List listFolders (query/response), listFiles (query/response), getFile (response). Check folder/file shapes: provider, previewStatus, errorCode present. Query params: folderId, parentId, search, provider, previewStatus, sortBy, sortOrder.

2. Explorer service lib/explorer/service.ts: listExplorerFolders, listExplorerFiles, getExplorerFile. Ownership (user)? Exclude deleted for normal list? Response shape camelCase and match explorer contracts?

3. Routes: GET /api/folders (parentId?), GET /api/files (folderId, search, provider, previewStatus, sortBy, sortOrder?), GET /api/files/[id]. Protected? Call explorer service? Response match contracts? GET /api/files/[id] returns 404 for missing or not-owned file?

4. Optional: GET /api/storage/drive/browse — when used; drive-browse contract.

5. Output: Write docs/phase8-explorer-audit-backend.md with: (a) Route table: Route | Method | Contract? | Protected? | Service? | Gaps. (b) Service: ownership, exclude deleted, response shape. (c) Gaps list. (d) Conclusion: "pass" or "needs fix" + files to fix. No code changes. Create the file in the workspace.
```

### 8.2 Stage 1 — Frontend audit

```
Act as frontend-developer per .cursor/agents/specialists/frontend-developer/SKILL.md.

Task: Phase 8 Unified Explorer — FRONTEND AUDIT ONLY (read-only; do not change code). Repo: [workspace path].

1. VaultClient: How does it fetch folders and files (API endpoints, query)? What props does it pass to FileGrid (folders, files, loading, error)?

2. FileGrid: Props (folders, files, loading, error). Does it show a loading state when loading is true? Does it show an error message when error is set? Does it show an empty state when !loading && !error && no folders && no files? Accessibility (e.g. role="alert" for error)?

3. Provider badge: Where is file provider (gdrive/onedrive) displayed? Same field as API (e.g. file.provider)?

4. Preview status: Where are previewStatus and errorCode shown? Same field names as API?

5. Contract alignment: Does FE expect list shapes (folders[], files[], total) and file shape matching explorer contracts? Any snake_case vs camelCase mismatch?

6. Output: Write docs/phase8-explorer-audit-frontend.md with: (a) Component table: Loading? | Error? | Empty? | Provider? | Preview? | Gaps. (b) Data flow VaultClient → FileGrid. (c) Gaps list. (d) Conclusion: "pass" or "needs fix" + files to fix. No code changes. Create the file in the workspace.
```

### 8.3 Stage 3 — Backend fix (fill fix list from Stage 2)

```
Act as backend-developer per .cursor/agents/specialists/backend-developer/SKILL.md.

Task: Phase 8 Unified Explorer — IMPLEMENT BACKEND FIXES.

[Orchestrator: paste backend fix list from Stage 2.]

Scope: [list files]. Required: [list]. Do not change explorer contract response shapes unless in fix list. Ensure 404 for missing file; response shapes match explorer contracts; provider and preview status in file list/detail.
```

### 8.4 Stage 3 — Frontend fix (fill fix list from Stage 2)

```
Act as frontend-developer per .cursor/agents/specialists/frontend-developer/SKILL.md.

Task: Phase 8 Unified Explorer — IMPLEMENT FRONTEND FIXES.

[Orchestrator: paste frontend fix list from Stage 2.]

Scope: [list files]. Required: [list]. Do not change API contracts. Ensure loading/error/empty states clear; provider badge and preview status visible where specified; contract alignment.
```

### 8.5 Stage 4 — Code-reviewer

```
Act as code-reviewer per .cursor/agents/specialists/code-reviewer/SKILL.md.

Review Phase 8 Unified Explorer. Scope: [list changed files or "audit docs only"].

Check: (1) Explorer API request/response match contracts. (2) All explorer routes protected. (3) 404 for missing file. (4) FileGrid loading/error/empty. (5) Provider and preview status in API and UI.

Output: Accept / Conditional accept + suggested fixes.
```

### 8.6 Stage 4 — QA-tester

```
Act as qa-tester per .cursor/agents/specialists/qa-tester/SKILL.md.

QA Phase 8 Unified Explorer. Repo: [workspace path].

Acceptance: (1) Users can browse folders and files. (2) List data canonical and stable. (3) UI states not misleading (loading, error, empty). (4) One unified library; provider badge and preview status.

Run scripts/verify-phase8-explorer.mjs if available (e.g. npm run qa:verify-phase8-explorer). Output: Pass/fail per criterion; manual steps; regression risks.
```

---

## 9. Phase 8 Completion Checklist (Orchestrator)

- [x] Stage 1: Called backend-developer and frontend-developer (audit only); have `docs/phase8-explorer-audit-backend.md` and `docs/phase8-explorer-audit-frontend.md`.
- [x] Stage 2: Read both audits; built fix list; if gaps, wrote handoffs for Stage 3.
- [x] Stage 3: If fix list non-empty — called backend and/or frontend developer(s); merged code.
- [x] Stage 4: Called code-reviewer and qa-tester (in parallel); received both outputs.
- [x] Done criteria Phase 8 (PLAN): browse folders/files; list canonical and stable; UI states not misleading; unified library.
- [x] Updated `docs/SLICE_STATUS.md` Phase 8 note.

When all items are checked, Phase 8 can be closed. Next: Phase 9 (Download/Stream) or Bước 5 completion per `docs/PLAN-remediation-execution.md`.
