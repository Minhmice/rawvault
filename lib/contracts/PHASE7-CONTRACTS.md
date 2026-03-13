# Phase 7 — File and Folder Metadata Contracts

Canonical contracts and types for file/folder metadata operations. Single source of truth.

---

## 1. Files Changed

| File | Changes |
|------|---------|
| `lib/contracts/metadata.contracts.ts` | Created/updated with folder, file, breadcrumb, and error schemas |
| `lib/contracts/index.ts` | Added `export * from "./metadata.contracts"` |
| `lib/contracts/explorer.contracts.ts` | No changes — ExplorerFolder, ExplorerFile remain canonical entity shapes |

---

## 2. Canonical Request/Response Shapes (Phase 7)

### Folder operations

| Operation | Request | Response |
|-----------|---------|----------|
| Create folder | `CreateFolderRequest`: `{ name: string, parentId?: string }` | `CreateFolderResponse`: `{ success: true, folder: ExplorerFolder }` |
| Rename folder | `RenameFolderRequest`: `{ name: string }` | Same as create — returns `{ success, folder }` |
| Move folder | `MoveFolderRequest`: `{ parentId: string \| null }` (null = root) | Same as create — returns `{ success, folder }` |
| Restore folder | (path param: `id`) | `RestoreFolderResponse`: `{ success: true, folder: ExplorerFolder }` |
| Delete folder | (path param: `id`) | `DeleteFolderResponse`: `{ success: true }` |

### File operations

| Operation | Request | Response |
|-----------|---------|----------|
| Rename file | `RenameFileRequest`: `{ name: string }` | Same as get file — returns `{ success, file }` |
| Move file | `MoveFileRequest`: `{ folderId: string \| null }` (null = root) | Same as get file — returns `{ success, file }` |
| Restore file | (path param: `id`) | `RestoreFileResponse`: `{ success: true, file: ExplorerFile }` |
| Delete file | (path param: `id`) | `DeleteFileResponse`: `{ success: true }` |

### Breadcrumb

| Operation | Request | Response |
|-----------|---------|----------|
| Get breadcrumb | (path param: `folderId` or query) | `GetBreadcrumbResponse`: `{ success: true, items: BreadcrumbItem[] }` |

`BreadcrumbItem`: `{ id: string, name: string }`

### Metadata error codes

| Code | Meaning |
|------|---------|
| `VALIDATION_ERROR` | Request body/params invalid |
| `UNAUTHORIZED` | 401 / not authenticated |
| `FOLDER_NOT_FOUND` | Folder not found or not owned |
| `FILE_NOT_FOUND` | File not found or not owned |
| `FOLDER_NAME_CONFLICT` | Sibling folder with same name |
| `FILE_NAME_CONFLICT` | Sibling file with same name |
| `FOLDER_CYCLE` | Move would create cycle |
| `PARENT_NOT_FOUND` | Target parent folder not found |
| `FOLDER_FETCH_FAILED` | DB/query error listing folders |
| `FILES_FETCH_FAILED` | DB/query error listing files |
| `FILE_FETCH_FAILED` | DB/query error fetching file |
| `METADATA_UPDATE_FAILED` | DB update failed |
| `INTERNAL_SERVER_ERROR` | Unknown server error |
| `UNKNOWN_ERROR` | Unclassified error |

Error response shape: `{ error: { code, message, details? } } — code from metadataErrorCodeSchema`

---

## 3. Drift Fixes Applied

| Drift | Fix |
|-------|-----|
| `updateFolderRequestSchema` (combined rename + move) | Replaced with `renameFolderRequestSchema` and `moveFolderRequestSchema` (separate operations) |
| `updateFileRequestSchema` (combined rename + move) | Replaced with `renameFileRequestSchema` and `moveFileRequestSchema` |
| `restoreFileResponseSchema` inline file schema | Replaced with `explorerFileSchema` — same shape as list/detail |
| `getBreadcrumbResponseSchema` used `breadcrumb` | Changed to `items` per spec |
| `deleteFolderResponseSchema` / `deleteFileResponseSchema` had `deletedAt` | Simplified to `{ success: true }` |
| `fileIdParamsSchema` duplicated in metadata | Removed — use `fileIdParamsSchema` from `explorer.contracts` |
| No metadata error codes | Added `metadataErrorCodeSchema` and `metadataErrorResponseSchema` |

---

## 4. Source-of-Truth Summary

| Location | Contents |
|---------|----------|
| `lib/contracts/explorer.contracts.ts` | `explorerFolderSchema`, `explorerFileSchema`, `listFoldersResponseSchema`, `listFilesResponseSchema`, `getFileResponseSchema`, `fileIdParamsSchema` |
| `lib/contracts/metadata.contracts.ts` | Folder: create, rename, move, delete, restore. File: rename, move, delete, restore. Breadcrumb. Metadata error codes. |

**Entity shapes**

- **ExplorerFolder**: `id`, `parentId`, `name`, `path`, `createdAt`, `updatedAt`
- **ExplorerFile**: `id`, `folderId`, `name`, `ext`, `mime`, `sizeBytes`, `provider`, `storageAccountId`, `previewStatus`, `syncStatus`, `errorCode`, `createdAt`, `updatedAt`

Create/update responses return the same shapes as list/detail — no drift.

---

## Usage

```ts
import {
  createFolderRequestSchema,
  createFolderResponseSchema,
  renameFolderRequestSchema,
  moveFolderRequestSchema,
  folderIdParamsSchema,
  renameFileRequestSchema,
  moveFileRequestSchema,
  getBreadcrumbResponseSchema,
  metadataErrorCodeSchema,
} from "@/lib/contracts";
```

Routes and services should validate and parse using these schemas. Frontend should use the same schemas for type safety and API contracts.
