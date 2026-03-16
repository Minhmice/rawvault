# Phase 7 — File and Folder Metadata Management: Execution Plan (Chi tiết)

**Mục đích**: Verify và (nếu cần) sửa folder/file routes, metadata service, contracts, path/breadcrumb và soft-delete consistency theo PLAN Phase 7. **Check trước, rồi mới giao ai làm gì.**

**Tham chiếu**:
- `PLAN.md` §7 Phase 7 (Goal, Objectives, Functional scope, Deliverables, Done criteria)
- `docs/PLAN-remediation-execution.md` Bước 5 (Phase 7, 8, 9; verify folder/file routes, path/breadcrumb)
- `.cursor/agents/orchestrator/SKILL.md`, `task-to-agent-mapping-rules.md`

---

## 1. Goal & Done Criteria (Phase 7)

**Goal**: Support app-layer organization and metadata operations for stored content.

**Done criteria** (PLAN):
- Folder navigation model is coherent.
- File records can be read and updated safely.
- Soft deletion is represented consistently.
- Move/rename flows preserve metadata correctness.

**Deliverables** (PLAN Phase 7):
- Folder contracts
- File contracts
- Folder/file routes
- Service-layer metadata operations
- Path/breadcrumb utilities
- Validation rules for move/rename/delete/restore

**Functional scope** (checklist for audit):
- Create folder
- Rename folder
- Soft delete folder
- Restore folder
- Create file metadata (via upload — Phase 6)
- Update file metadata (rename, move)
- Soft delete file
- Restore file
- Move file
- Move folder
- Rename file
- Get file details
- List by folder (explorer — may overlap Phase 8)
- Breadcrumb/path behavior

---

## 2. Tổng quan thứ tự làm (4 giai đoạn)

| Giai đoạn | Mục đích | Ai làm | Song song? | Output |
|-----------|----------|--------|------------|--------|
| **Stage 1 — Audit (check trước)** | Đọc folder/file routes, metadata service, contracts; không sửa; ra báo cáo gaps | backend-developer | — | 1 báo cáo audit (backend) |
| **Stage 2 — Orchestrator** | Đọc audit → fix list → assignment | Orchestrator | — | Fix list + handoff cho Stage 3 |
| **Stage 3 — Fix (implementation)** | Sửa theo fix list (chỉ khi có gap) | backend-developer | — | Code changes |
| **Stage 4 — Review & QA** | Review metadata + QA (folder/file CRUD, path/breadcrumb) | code-reviewer + qa-tester | **Có** (2 agent song song) | Review report + QA report |

**Nguyên tắc**: Stage 1 chỉ đọc và viết báo cáo. Chỉ sau khi có fix list (Stage 2) mới gọi Stage 3. Phase 7 tập trung metadata (folder/file CRUD, soft delete, restore, move, rename, breadcrumb); Phase 8 (unified explorer UI) có plan riêng.

---

## 3. Stage 1 — Audit (Check trước)

### 3.1 Điều kiện

- **Backend audit** (một agent): folder routes, file routes, metadata service, contracts, path/breadcrumb, soft-delete consistency.
- **Điều kiện bắt đầu Stage 1**: Orchestrator gọi 1 `mcp_task` (backend-developer) với prompt audit-only.
- **Điều kiện kết thúc Stage 1**: Có `docs/phase7-metadata-audit-backend.md`. Orchestrator đọc và tạo fix list.

### 3.2 Backend-developer — Audit (read-only)

**Nhiệm vụ**:

1. **Contracts**
   - Đọc `lib/contracts/metadata.contracts.ts` (và export từ `lib/contracts/index.ts`). Liệt kê: createFolder (request/response), renameFolder, moveFolder, deleteFolder, restoreFolder; renameFile, moveFile, deleteFile, restoreFile; getBreadcrumb (response); metadataErrorCodeSchema.
   - Kiểm tra: Folder create có name, parentId (nullish)? Folder rename/move có name / parentId? File rename/move có name / folderId? Soft delete responses có success? Restore responses có folder/file? Breadcrumb có items (id, name)? Error codes có FOLDER_NOT_FOUND, FILE_NOT_FOUND, FOLDER_NAME_CONFLICT, FILE_NAME_CONFLICT, FOLDER_CYCLE, PARENT_NOT_FOUND?

2. **Folder routes**
   - `GET /api/folders` — list folders (có thể delegate explorer). Protected? Query params? Response shape?
   - `POST /api/folders` — create folder. Body (name, parentId?)? Validate với createFolderRequestSchema? Protected? Return 201 + folder? Ownership (user_id)?
   - `PATCH /api/folders/[id]` — rename and/or move. Body (name?, parentId?)? Gọi renameFolder / moveFolder? Protected? Response shape?
   - `DELETE /api/folders/[id]` — soft delete. Protected? Gọi softDeleteFolder? Response success?
   - `GET /api/folders/[id]/breadcrumb` — breadcrumb for folder. Protected? Gọi getBreadcrumb? Response items (id, name) root → leaf?
   - `POST /api/folders/[id]/restore` — restore folder. Protected? Gọi restoreFolder? Response folder?

3. **File routes**
   - `GET /api/files` — list files (có thể delegate explorer). Protected? Query params?
   - `GET /api/files/[id]` — get file details. Protected? Gọi getExplorerFile? Response shape?
   - `PATCH /api/files/[id]` — rename and/or move. Body (name?, folderId?)? Gọi renameFile / moveFile? Protected?
   - `DELETE /api/files/[id]` — soft delete. Protected? Gọi softDeleteFile?
   - `POST /api/files/[id]/restore` — restore file. Protected? Gọi restoreFile? Response file?

4. **Metadata service**
   - `lib/metadata/service.ts`: createFolder, renameFolder, moveFolder, softDeleteFolder, restoreFolder; renameFile, moveFile, softDeleteFile, restoreFile; getBreadcrumb (hoặc breadcrumb trong service/explorer).
   - **Ownership**: Mọi op có filter/theo user_id (auth.uid())? RLS đủ chưa (đã verify Phase 2)?
   - **Path**: createFolder / moveFolder có compute path (computeFolderPath)? path có format nhất quán (root "/", child parent_path + "/" + name)? Move có cập nhật path cho subtree không?
   - **Soft delete**: softDeleteFolder / softDeleteFile set deleted_at? restore clear deleted_at? List/get có filter deleted_at null (hoặc tùy query)?
   - **Uniqueness**: Rename/move có check name conflict (FOLDER_NAME_CONFLICT, FILE_NAME_CONFLICT) trong cùng parent/folder?
   - **Cycle**: moveFolder có check FOLDER_CYCLE (move vào descendant)?
   - **Restore**: restore có check parent/folder exists và chưa deleted?

5. **Breadcrumb**
   - getBreadcrumb (hoặc tương đương): Input folder id (và user)? Trả items từ root đến folder đó? Path build từ DB path hoặc traverse parent_id? Response match getBreadcrumbResponseSchema?

6. **Consistency**
   - Soft deletion: folders và files đều dùng deleted_at? Explorer list có exclude deleted (deleted_at is null) khi không query trash?
   - Move/rename: metadata (path, name, folder_id) update đúng; không để orphan hoặc invalid parent_id/folder_id?

7. **Output**
   - Báo cáo: (a) Bảng Route | Method | Contract? | Protected? | Service op? | Gaps. (b) Service: bảng Op | Ownership? | Path? | Soft delete? | Uniqueness? | Cycle check? | Gaps. (c) Breadcrumb flow. (d) List gaps (thiếu route, thiếu validation, path không update on move, soft delete inconsistent, thiếu cycle check). (e) Kết luận: "pass" hay "needs fix" + files to fix.

**ScopeIn**: `app/api/folders/route.ts`, `app/api/folders/[id]/route.ts`, `app/api/folders/[id]/breadcrumb/route.ts`, `app/api/folders/[id]/restore/route.ts`, `app/api/files/route.ts`, `app/api/files/[id]/route.ts`, `app/api/files/[id]/restore/route.ts`, `lib/metadata/service.ts`, `lib/contracts/metadata.contracts.ts`, `lib/contracts/index.ts`, `lib/explorer/service.ts` (listExplorerFolders, listExplorerFiles, getExplorerFile, parseFoldersQuery, parseFilesQuery — nếu dùng cho list).

**ScopeOut**: Không sửa code. Không đổi explorer UI (Phase 8). Chỉ đọc và viết báo cáo.

**Output artifact**: `docs/phase7-metadata-audit-backend.md`

---

### 3.3 Orchestrator sau Stage 1

- Đọc `docs/phase7-metadata-audit-backend.md`.
- Gộp gaps → **Backend fix list** (routes, service, contracts, path/breadcrumb, soft-delete).
- Nếu **không có gap**: Cập nhật SLICE_STATUS Phase 7 note "Verified"; chuyển Stage 4 (review + QA).
- Nếu **có gap**: Soạn handoff Stage 3, gọi backend-developer fix.

---

## 4. Stage 2 — Orchestrator: Fix list & Assignment

**Input**: Báo cáo audit backend.

**Việc orchestrator làm**:
1. **Backend fix list**: Từng item (ví dụ: thêm cycle check trong moveFolder; đảm bảo path update on move; thêm name conflict check; align response với contract). Gắn file path.
2. Viết **handoff** cho Stage 3: scope (files), required (list), non-goals (no explorer UI change, no DB schema change unless in fix list).
3. Quyết định chạy Stage 3 nếu có fix.

---

## 5. Stage 3 — Fix (Implementation)

**Điều kiện**: Đã có fix list từ Stage 2.

### 5.1 Backend-developer — Fix

- Scope: `app/api/folders/**`, `app/api/files/**` (metadata routes), `lib/metadata/service.ts`, `lib/contracts/metadata.contracts.ts` (nếu cần).
- Required: Theo fix list (path consistency, soft delete, move/rename validation, breadcrumb, contract alignment).
- Do not: Thay đổi explorer list contract (Phase 8); thay đổi DB schema trừ khi nằm trong fix list.

### 5.2 Sau Stage 3

- Merge code. Chuẩn bị scope cho Stage 4.

---

## 6. Stage 4 — Review & QA

### 6.1 Code-reviewer

- Scope: Phase 7 metadata (folder/file routes, metadata service, contracts).
- Check: (1) Request/response match contracts. (2) All routes protected. (3) Path/breadcrumb consistent; path update on move. (4) Soft delete (deleted_at) consistent; restore clears deleted_at. (5) Uniqueness and cycle checks where required. (6) Error codes from metadataErrorCodeSchema.

### 6.2 QA-tester

- Acceptance: (1) Folder navigation model coherent (create, rename, move, delete, restore; path/breadcrumb correct). (2) File records read and update safely (get, rename, move, delete, restore). (3) Soft deletion represented consistently (deleted_at; list excludes deleted unless trash view). (4) Move/rename preserve metadata correctness (path, name, folder_id).
- Output: Pass/fail per criterion; manual test steps (create folder, rename, move, delete, restore, breadcrumb; same for file); regression risks.

### 6.3 Sau Stage 4

- Tổng hợp; cập nhật SLICE_STATUS Phase 7; báo Phase 7 complete. Bước tiếp: Phase 8 (Unified Explorer) hoặc Bước 5 (Phase 7+8+9) theo `docs/PLAN-remediation-execution.md`.

---

## 7. Bảng thứ tự làm cho từng agent

| Bước | Agent | Làm gì | Điều kiện bắt đầu | Song song với |
|------|--------|--------|-------------------|---------------|
| 1 | backend-developer | Audit: folder/file routes, metadata service, contracts, path/breadcrumb, soft delete → `docs/phase7-metadata-audit-backend.md` | Orchestrator gọi mcp_task | — |
| 2 | orchestrator | Đọc audit → fix list → handoff Stage 3 | Đã có file audit | — |
| 3 | backend-developer | Fix theo fix list (chỉ khi có gap) | Đã có handoff Stage 2 | — |
| 4a | code-reviewer | Review Phase 7 metadata (routes, service, contracts, path, soft delete) | Đã merge Stage 3 hoặc chỉ audit | qa-tester (4b) |
| 4b | qa-tester | QA: folder/file CRUD, path/breadcrumb, soft delete consistency, move/rename correctness | Đã merge Stage 3 hoặc chỉ audit | code-reviewer (4a) |

---

## 8. Prompt mẫu cho từng lần gọi agent

### 8.1 Stage 1 — Backend audit

```
Act as backend-developer per .cursor/agents/specialists/backend-developer/SKILL.md.

Task: Phase 7 File and Folder Metadata Management — AUDIT ONLY (read-only; do not change code). Repo: /Users/minhmice/Documents/Projects/rawvault.

1. Contracts: Read lib/contracts/metadata.contracts.ts and lib/contracts/index.ts. List createFolder, renameFolder, moveFolder, deleteFolder, restoreFolder; renameFile, moveFile, deleteFile, restoreFile; getBreadcrumb response; metadataErrorCodeSchema. Check request/response shapes and error codes (FOLDER_NOT_FOUND, FILE_NOT_FOUND, FOLDER_NAME_CONFLICT, FILE_NAME_CONFLICT, FOLDER_CYCLE, PARENT_NOT_FOUND).

2. Folder routes: GET/POST /api/folders; PATCH/DELETE /api/folders/[id]; GET /api/folders/[id]/breadcrumb; POST /api/folders/[id]/restore. For each: method, body/query, protected (requireAuthenticatedUser)? Calls which service function? Response matches contract?

3. File routes: GET /api/files; GET/PATCH/DELETE /api/files/[id]; POST /api/files/[id]/restore. Same checks: protected, service, response shape.

4. Metadata service lib/metadata/service.ts: createFolder, renameFolder, moveFolder, softDeleteFolder, restoreFolder; renameFile, moveFile, softDeleteFile, restoreFile; getBreadcrumb (or breadcrumb logic). For each op: ownership (user_id)? Path computation (computeFolderPath, path update on move)? Soft delete (set/clear deleted_at)? Uniqueness (name conflict in same parent)? Cycle check (move folder into descendant)? Restore (parent exists, not deleted)?

5. Breadcrumb: How is breadcrumb built (folder path from root to folder)? Response getBreadcrumbResponseSchema (items: id, name)?

6. Consistency: Soft delete used consistently (deleted_at)? Move/rename update path and references correctly?

7. Output: Write docs/phase7-metadata-audit-backend.md with: (a) Table Route | Method | Contract? | Protected? | Service? | Gaps. (b) Service table: Op | Ownership? | Path? | Soft delete? | Uniqueness? | Cycle? | Gaps. (c) Breadcrumb flow. (d) List of gaps. (e) Conclusion: "pass" or "needs fix" + files to fix. No code changes. Create the file in the workspace.
```

### 8.2 Stage 3 — Backend fix (điền fix list từ Stage 2)

```
Act as backend-developer per .cursor/agents/specialists/backend-developer/SKILL.md.

Task: Phase 7 File and Folder Metadata Management — IMPLEMENT FIXES.

[Orchestrator: paste backend fix list from Stage 2.]

Scope: [list files]. Required: [list]. Do not change explorer list contract (Phase 8) or DB schema unless in fix list. Ensure path/breadcrumb consistent; soft delete consistent; move/rename validation (uniqueness, cycle); contract alignment.
```

### 8.3 Stage 4 — Code-reviewer

```
Act as code-reviewer per .cursor/agents/specialists/code-reviewer/SKILL.md.

Review Phase 7 File and Folder Metadata Management. Scope: [list changed files or "docs/phase7-metadata-audit-backend.md only"].

Check: (1) Request/response match contracts. (2) All routes protected. (3) Path/breadcrumb consistent; path update on move. (4) Soft delete consistent; restore clears deleted_at. (5) Uniqueness and cycle checks. (6) Error codes from metadataErrorCodeSchema.

Output: Accept / Conditional accept + suggested fixes.
```

### 8.4 Stage 4 — QA-tester

```
Act as qa-tester per .cursor/agents/specialists/qa-tester/SKILL.md.

QA Phase 7 File and Folder Metadata Management. Repo: /Users/minhmice/Documents/Projects/rawvault.

Acceptance criteria: (1) Folder navigation model coherent (create, rename, move, delete, restore; path/breadcrumb correct). (2) File records read and update safely (get, rename, move, delete, restore). (3) Soft deletion represented consistently. (4) Move/rename preserve metadata correctness.

Output: Pass/fail per criterion; manual test steps; regression risks.
```

---

## 9. Checklist hoàn thành Phase 7 (Orchestrator)

- [x] Stage 1: Đã gọi backend-developer (audit only); có `docs/phase7-metadata-audit-backend.md`.
- [x] Stage 2: Đã đọc audit; có fix list; nếu có gap đã soạn handoff cho Stage 3.
- [x] Stage 3: Nếu có fix list — đã gọi backend-developer (fix); đã merge code.
- [x] Stage 4: Đã gọi code-reviewer + qa-tester (song song); đã nhận output cả hai.
- [x] Done criteria Phase 7 (PLAN): folder navigation coherent; file read/update safe; soft delete consistent; move/rename correct.
- [x] Cập nhật `docs/SLICE_STATUS.md` Phase 7 note.

Sau khi tất cả checkbox đạt, Phase 7 có thể coi là đóng. Bước tiếp: Phase 8 (Unified Explorer) hoặc Bước 5 (Phase 7+8+9) theo `docs/PLAN-remediation-execution.md`.
