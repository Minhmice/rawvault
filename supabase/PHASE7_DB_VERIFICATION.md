# Phase 7 — File and Folder Metadata Management: DB Verification

This document verifies and documents DB support for Phase 7 metadata lifecycle. It does **not** introduce new migrations unless strictly necessary; app-layer validation is preferred where the schema is sufficient.

---

## 1. Integrity & Uniqueness

### Folders

| Rule | Implementation | Status |
|------|----------------|--------|
| Path uniqueness (active only) | `folders_user_path_active_uniq` on `(user_id, path)` WHERE `deleted_at IS NULL` | ✅ |
| Multiple deleted folders same path | Partial index excludes deleted rows; deleted rows are not constrained | ✅ |
| Parent not self | `folders_parent_not_self` CHECK (`parent_id IS NULL OR parent_id <> id`) | ✅ |

**Documented:** Can two folders have the same path if one is deleted? **Yes.** The partial unique index applies only when `deleted_at IS NULL`. Deleted folders are excluded, so multiple deleted folders may share the same path.

### Files

| Rule | Implementation | Status |
|------|----------------|--------|
| Name uniqueness per folder (active only) | `files_user_folder_name_active_uniq` on `(user_id, folder_id, name)` WHERE `deleted_at IS NULL` | ✅ |
| Same name when deleted | Partial index excludes deleted rows | ✅ |
| Root-level files (`folder_id` NULL) | In PostgreSQL, NULLs are distinct in unique indexes | ⚠️ See risk below |

**Root-level file uniqueness risk:** For `folder_id = NULL`, the unique index treats each NULL as distinct. Multiple active files with the same name in the root (e.g. `user_id=X, folder_id=NULL, name='photo.raw'`) are **allowed**. App layer should enforce uniqueness for root-level files if desired, or accept multiple root files with the same name (e.g. from different uploads).

---

## 2. Move / Rename Constraints

### Folder move

| Constraint | Where | Notes |
|------------|-------|-------|
| `parent_id` change | DB allows | FK `folders.parent_id` → `folders(id)` ON DELETE SET NULL |
| Cycle prevention | **App layer** | DB has `parent_id <> id` only. Preventing parent = descendant requires app-layer traversal or a trigger. **MVP: app-layer validation.** |
| Path update | **App layer** | When folder moves, `path` must change; children paths must cascade. **MVP: app layer.** |

### File move

| Constraint | Where | Notes |
|------------|-------|-------|
| `folder_id` change | DB allows | FK `files.folder_id` → `folders(id)` ON DELETE SET NULL |
| Target folder exists | RLS + app | Target must exist and be owned by user. RLS `files_owner_only` + app validation of target folder ownership. |
| Target folder not deleted | **App layer** | Validate target has `deleted_at IS NULL`. |

---

## 3. Restore Constraints

### Restore folder

| Scenario | Behavior | Recommendation |
|----------|----------|----------------|
| Parent is deleted | Restore would place folder under deleted parent | **Require restore parent first, or set `parent_id` to NULL (root) on restore.** Document in service layer. |
| Path collision | Active sibling has same path | Uniqueness index rejects. **Reject restore with clear error** or app-layer auto-rename. Document choice. |

### Restore file

| Scenario | Behavior | Recommendation |
|----------|----------|----------------|
| Folder is deleted | `folder_id` points to deleted folder | **Set `folder_id` to NULL on restore** (root), or require folder restore first. Document in service layer. |
| Name collision | Active sibling in same folder has same name | Uniqueness index rejects. **Reject restore** or **auto-rename** (e.g. `name (1).ext`). Document choice. |

### Documented restore rules (for service layer)

- **Folder restore:** If `parent_id` points to a deleted folder, either (a) reject with "restore parent first", or (b) set `parent_id = NULL` (move to root).
- **File restore:** If `folder_id` points to a deleted folder, set `folder_id = NULL` (root).
- **Name collision:** Reject restore with a clear error, or implement auto-rename. MVP: **reject** is simpler.

---

## 4. Migration Needs

### New migration required?

**None.** The foundation schema is sufficient for Phase 7. App-layer validation covers:

- Cycle prevention on folder move
- Path cascade on folder move
- Target folder validation on file move
- Restore parent/folder handling
- Name collision handling on restore

### Optional future indexes (not required for MVP)

- **Trash listing:** `folders` and `files` could gain partial indexes `WHERE deleted_at IS NOT NULL` for trash queries. Current `user_id` + `created_at` indexes are adequate for small trash volumes.
- **Path updates:** No DB trigger for path cascade; app layer handles it.

### Activity logs

- `activity_logs.resource_type` uses `share_resource_type` enum (`'file' | 'folder'`).
- Column is nullable; use `'file'` or `'folder'` for metadata actions.
- **Sufficient** for Phase 7 metadata actions (create, rename, move, delete, restore).

---

## 5. RLS Verification

| Table | Policy | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|--------|
| `folders` | `folders_owner_only` | ✅ | ✅ | ✅ | ✅ |
| `files` | `files_owner_only` | ✅ | ✅ | ✅ | ✅ |

- **USING:** `user_id = auth.uid()` — visible only owned rows.
- **WITH CHECK:** `user_id = auth.uid()` — insert/update must keep ownership.
- **Soft delete:** `UPDATE ... SET deleted_at = now()` does not change `user_id`; passes WITH CHECK. ✅

---

## 6. Restore / Move / Path Collision Risks (Summary)

- **Folder move cycle:** App must prevent `parent_id` from being self or any descendant.
- **Path cascade:** App must update `path` for moved folder and all descendants when `parent_id` changes.
- **File move target:** App must ensure target folder exists, is owned, and is not deleted.
- **Restore folder into deleted parent:** Reject or set to root; document choice.
- **Restore file into deleted folder:** Set `folder_id = NULL`; document.
- **Name collision on restore:** Reject (recommended for MVP) or auto-rename; document choice.
- **Root-level file name uniqueness:** Multiple files with same name in root are allowed; enforce in app if needed.

---

## 7. Repeatability and Compatibility

- **Migrations:** All existing migrations are additive and idempotent (`IF NOT EXISTS`, `IF NOT EXISTS` for policies).
- **No schema changes** for Phase 7; existing `folders` and `files` schema supports Phase 7 scope.
- **Compatibility:** Works with current RLS, FKs, and indexes. No breaking changes.

---

## 8. Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/*` | **None** |
| `supabase/PHASE7_DB_VERIFICATION.md` | **Created** — this document |
