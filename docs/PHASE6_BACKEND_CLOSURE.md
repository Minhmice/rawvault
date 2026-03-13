# Phase 6 Backend Closure Note

**Date:** 2025-03-13  
**Scope:** Real Provider Upload Execution  
**Status:** Closed

---

## 1. Validation Summary

### 1.1 Multipart Form Parsing (route)

| Field | Parsed | Validation |
|-------|--------|------------|
| `file` | `formData.get("file")` | Must be `File` instance |
| `fileName` | `parseFormValue("fileName")` or `file.name` | Fallback `"unnamed"` |
| `sizeBytes` | `parseFormValue("sizeBytes")` or `file.size` | `^\d+$` or file.size |
| `mime` | `parseFormValue("mime")` | Optional, trimmed |
| `folderId` | `parseFormValue("folderId")` | UUID regex, optional |
| `preferredProvider` | `parseFormValue("preferredProvider")` | `gdrive` \| `onedrive`, optional |
| `preferredAccountId` | `parseFormValue("preferredAccountId")` | UUID regex, optional |

Content-Type must be `multipart/form-data`.

### 1.2 Request Contract

`executeRequest` matches `uploadExecuteRequestSchema`:

- `fileName`: string, 1–255 chars
- `sizeBytes`: non-negative int
- `mime`: optional, 1–255 chars
- `folderId`: optional UUID
- `preferredProvider`: optional `gdrive` \| `onedrive`
- `preferredAccountId`: optional UUID

### 1.3 Response Contract

Success response matches `uploadExecuteSuccessResponseSchema`:

```json
{
  "success": true,
  "file": {
    "id": "uuid",
    "name": "string",
    "provider": "gdrive" | "onedrive",
    "storageAccountId": "uuid",
    "providerFileId": "string",
    "sizeBytes": number,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

### 1.4 Error Normalization

- `handleRouteError` maps `ApiError` → `{ error: { code, message, details? } }` with correct status
- `handleRouteError` maps `ZodError` → 400 `VALIDATION_ERROR` (added in closure)
- `handleRouteError` maps unknown errors → 500 `INTERNAL_SERVER_ERROR`

### 1.5 Retry Safety

- No metadata write before provider success
- Metadata write only after `providerResult` is obtained
- Auth failure (401/403/`OAUTH_TOKEN_INVALID`) calls `markAccountTokenInvalid`

---

## 2. Files Changed

| File | Change |
|------|--------|
| `lib/api/responses.ts` | `ZodError` handling → 400 `VALIDATION_ERROR` |
| `lib/uploads/execute.service.ts` | `parentFolderId: null` for adapters (MVP limitation) |
| `lib/contracts/upload-execute.contracts.ts` | Extended `uploadExecuteErrorCodeSchema` with provider/execute codes |

---

## 3. Contract Confirmation

| Contract | Status |
|----------|--------|
| Request: `uploadExecuteRequestSchema` | Aligned |
| Success: `uploadExecuteSuccessResponseSchema` | Aligned |
| Error: `error.code` in `uploadExecuteErrorCodeSchema` | Aligned |

---

## 4. Remaining Provider Execution Risks

| Risk | Mitigation |
|------|------------|
| **Provider folder targeting** | MVP: uploads go to provider root; `folder_id` in metadata is app-level only. Future: provider folder mapping needed. |
| **Partial failure after provider success** | DB write failure logs `upload_metadata_persistence_failed` and throws `METADATA_PERSISTENCE_FAILED` with `providerFileId` for recovery. |
| **Token expiry during upload** | `getUsableProviderToken` handles refresh; auth failure marks account invalid. |
| **Provider API drift** | Adapters isolate provider logic; errors normalized to `ApiError` |
| **Large file size** | 50 MB limit enforced; chunking not in scope for MVP. |

---

## 5. Phase 6 Closure Checklist

- [x] Route parses multipart correctly
- [x] Request matches schema
- [x] Response matches schema
- [x] Error normalization (ApiError, ZodError)
- [x] Retry-safe: no partial metadata before provider success
- [x] Auth failure marks account invalid
- [x] Provider folder handling documented (MVP: root only)
