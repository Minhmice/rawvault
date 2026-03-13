# Phase 6 Backend Closure — Execute Route Validation

## 1. Validation Summary

The execute route (`POST /api/uploads/execute`) has been validated against the canonical multipart flow, contracts, and retry-safety requirements. **No code changes are required** — the implementation is aligned with PLAN.md and PHASE6_PLAN.md.

---

## 2. Required Checks — Results

### 2.1 Multipart Form Parsing ✓

| Field | Source | Validation |
|-------|--------|------------|
| `file` | `formData.get("file")` | Required; must be `File` instance |
| `fileName` | Form or `file.name` fallback | Trimmed; fallback `"unnamed"` if empty |
| `sizeBytes` | Form or `file.size` fallback | Numeric; `/^\d+$/` or `file.size` |
| `mime` | Form | Optional; `mime?.trim() \|\| undefined` |
| `folderId` | Form | Optional; `folderIdRaw?.trim() \|\| undefined` |
| `preferredProvider` | Form | Optional; `accountProviderSchema.safeParse()` |
| `preferredAccountId` | Form | Optional; `preferredAccountId?.trim() \|\| undefined` |

- Content-Type enforced: `multipart/form-data`
- Form keys use `UPLOAD_EXECUTE_FORM_KEYS` (canonical source)
- Empty/whitespace strings normalized to `undefined` for optional fields

### 2.2 Request Schema Alignment ✓

`executeRequest` matches `uploadExecuteRequestSchema`:

- **folderId**: `z.string().uuid().optional()` — invalid UUIDs cause parse failure → 400 VALIDATION_ERROR
- **preferredAccountId**: `z.string().uuid().optional()` — same
- **preferredProvider**: `accountProviderSchema` (`gdrive` \| `onedrive`) — invalid values become `undefined`
- **fileName**: min 1, max 255; fallback `"unnamed"`
- **sizeBytes**: non-negative int; coerced from form or `file.size`
- **mime**: optional; `mimeSchema` (trim, min 1, max 255) when provided

### 2.3 Response Schema Alignment ✓

Success response validated with `uploadExecuteSuccessResponseSchema.parse()`:

- `success: true`
- `file`: `id`, `name`, `provider`, `storageAccountId`, `providerFileId`, `sizeBytes`, `createdAt`, `updatedAt`
- `createdAt` / `updatedAt` via `toIsoString()` (ISO 8601)
- No provider-specific fields in the public response

### 2.4 Error Normalization ✓

`handleRouteError` + `ApiError` produce canonical error shape:

- **ApiError**: `{ error: { code, message, details? } }`, status from `error.status`
- **ZodError**: 400, `VALIDATION_ERROR`, `"Invalid request."`, `details` in dev
- **Unknown**: 500, `INTERNAL_SERVER_ERROR`, `"An unexpected server error occurred."`

All error codes used in the execute flow are in `uploadExecuteErrorCodeSchema`:

- Route: VALIDATION_ERROR, UNAUTHORIZED
- Service: VALIDATION_ERROR, FILE_TOO_LARGE, SIZE_MISMATCH, METADATA_PERSISTENCE_FAILED
- Dispatch: VALIDATION_ERROR, UPLOAD_DISPATCH_LOOKUP_FAILED, NO_LINKED_ACCOUNTS, NO_ELIGIBLE_ACCOUNT, PREFERRED_ACCOUNT_NOT_FOUND, ACTIVITY_LOG_WRITE_FAILED
- Token lifecycle: TOKEN_LOAD_FAILED, ACCOUNT_NOT_FOUND, TOKEN_INVALID, TOKEN_MISSING, TOKEN_DECRYPT_FAILED, TOKEN_EXPIRED, TOKEN_REFRESH_FAILED, TOKEN_PERSIST_FAILED
- Adapters: OAUTH_TOKEN_INVALID, PROVIDER_UPLOAD_FAILED, PROVIDER_RESOURCE_NOT_FOUND, PROVIDER_QUOTA_EXCEEDED

### 2.5 Retry-Safety ✓

- **No partial success metadata before provider success**: Metadata insert runs only after `providerResult` is returned. No file row is written before provider upload succeeds.
- **Auth failure marks account invalid**: On `OAUTH_TOKEN_INVALID` or 401/403, `markAccountTokenInvalid()` is called before rethrowing.
- **Provider success + DB failure**: Logged as `upload_metadata_persistence_failed`; client receives 500 `METADATA_PERSISTENCE_FAILED` with `providerFileId` in details for support.

---

## 3. Exact Backend Files Changed

**None.** Current implementation meets all Phase 6 requirements.

---

## 4. Final Request/Response Contract Confirmation

### Request (multipart/form-data)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| file | File | ✓ | Required |
| fileName | string | ✓ | 1–255 chars; fallback `"unnamed"` |
| sizeBytes | number | ✓ | Non-negative int; form or `file.size` |
| mime | string | | Optional; 1–255 chars if present |
| folderId | string | | Optional; UUID if present |
| preferredProvider | string | | Optional; `gdrive` \| `onedrive` |
| preferredAccountId | string | | Optional; UUID if present |

### Success Response (201)

```json
{
  "success": true,
  "file": {
    "id": "uuid",
    "name": "string",
    "provider": "gdrive" | "onedrive",
    "storageAccountId": "uuid",
    "providerFileId": "string",
    "sizeBytes": 0,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "error": {
    "code": "<from uploadExecuteErrorCodeSchema>",
    "message": "string",
    "details": {}
  }
}
```

---

## 5. Remaining Provider Execution Risks

| Risk | Mitigation | Status |
|------|-------------|--------|
| Provider upload succeeds, DB insert fails | Activity log `upload_metadata_persistence_failed`; client gets `providerFileId` in details | ✓ Documented |
| Token expiry during upload | Refresh-on-demand in token lifecycle; auth failure marks account invalid | ✓ Implemented |
| Provider API rate limits / 429 | Not mapped to specific code; surfaces as PROVIDER_UPLOAD_FAILED | ⚠️ Future: add RATE_LIMITED code |
| Large file / chunking | 50 MB MVP limit; no resumable upload | ⚠️ Future: chunked upload for larger files |
| Network timeout mid-upload | No explicit timeout; fetch may hang | ⚠️ Future: AbortController + timeout |
| GDrive multipart boundary | Random boundary per request; no collision risk | ✓ OK |
| OneDrive parent folder | `parentFolderId` always null; upload to root | ✓ Per MVP scope |

---

## 6. Phase 6 Closure Note for Backend

Phase 6 backend is **closed** for the execute route:

- Multipart parsing is correct and uses canonical form keys.
- Request/response contracts are enforced and aligned with `upload-execute.contracts.ts`.
- Error handling is normalized and uses the defined error codes.
- Execution is retry-safe: no metadata before provider success; auth failures update account status.
- Provider adapters (GDrive, OneDrive) are isolated and return normalized results.

**Recommendations for later phases:**

1. Add `RATE_LIMITED` to the error code schema if provider 429 handling is needed.
2. Introduce explicit timeouts for provider fetch calls.
3. Consider chunked/resumable upload for files > 50 MB.
4. Add provider folder mapping when app-level `folderId` maps to provider folder IDs.
