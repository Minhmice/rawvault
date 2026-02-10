# Task: Backend-B — RawVault MVP (Schema, Storage, Preview Pipeline)

**Route id:** db_change  
**Owner:** backend-b  
**Skills required:** db-migrations, performance, logging-observability  
**Skills suggested:** —  
**Gates required:** qa, docs  

**Source:** PRD v1.1 — `rawvault.md` (sections 5, 6, 7, 10).

---

## 1. Mục tiêu

Triển khai data model (Postgres), migrations, storage buckets, RLS và preview pipeline (queue + job processor) cho RawVault MVP. Đảm bảo một migration một thay đổi logic, có rollback, và logging có requestId/correlation id.

---

## 2. Phạm vi công việc

### 2.1 Data model (Postgres)

**Bảng `folders`**

| Cột | Kiểu | Ghi chú |
|-----|------|--------|
| id | uuid | PK |
| owner_id | uuid | auth uid |
| parent_id | uuid | NULL |
| name | text | |
| path | text | materialized path (MVP-friendly) |
| created_at, updated_at | timestamptz | |
| deleted_at | timestamptz | NULL |

**Bảng `files`**

| Cột | Kiểu | Ghi chú |
|-----|------|--------|
| id | uuid | PK |
| owner_id | uuid | |
| folder_id | uuid | FK |
| name | text | |
| ext | text | |
| mime | text | |
| size_bytes | bigint | |
| storage_key_original | text | |
| storage_key_thumb | text | NULL |
| storage_key_preview | text | NULL |
| preview_status | enum | pending \| processing \| ready \| failed |
| error_code | text | NULL (taxonomy: unsupported_raw, conversion_error, timeout, storage_error, invalid_file) |
| metadata | jsonb | NULL (EXIF, width, height, taken_at, camera) |
| created_at, updated_at | timestamptz | |
| deleted_at | timestamptz | NULL |

**Bảng `preview_jobs` (MVP queue)**

| Cột | Kiểu | Ghi chú |
|-----|------|--------|
| id | uuid | PK |
| file_id | uuid | FK → files |
| owner_id | uuid | |
| status | enum | pending \| processing \| done \| failed |
| attempts | int | |
| last_error_code | text | NULL |
| created_at, updated_at | timestamptz | |

### 2.2 Migrations

- Một file migration cho mỗi thay đổi logic (folders, files, preview_jobs, enums).
- Rollback: ghi rõ trong migration notes (down script hoặc bước thủ công).
- RLS policies: mọi bảng đều `owner_id = auth.uid()` (Supabase `auth.uid()` nếu dùng Supabase).

### 2.3 Storage (Supabase Storage)

- **Buckets:**
  - `rawvault-original` (private) — file gốc upload.
  - `rawvault-derivatives` (private) — thumb + preview.
- Policies: chỉ owner (hoặc service role khi xử lý job) mới đọc/ghi đúng path.
- Signed URL: viewer/list dùng signed URL cho thumb | preview | original (expire theo config). Supabase JS `createSignedUrl(s)`.

### 2.4 Upload flow (phối hợp với backend-a)

1. Client gọi `POST /api/uploads/sign` (backend-a) → backend-a có thể gọi service/storage để lấy signed upload URL.
2. Client upload trực tiếp vào `rawvault-original`.
3. Client gọi `POST /api/files` (backend-a) → insert `files` + insert `preview_jobs` (backend-b cung cấp schema/query hoặc backend-a gọi DB).
4. Orchestrator: `POST /api/jobs/preview/run` (backend-a) gọi job processor (backend-b hoặc Edge Function).

### 2.5 Preview pipeline (job processor)

- **Input:** file_id, storage_key_original (đọc từ `files` + `preview_jobs`).
- **Logic:** decode RAW → tạo thumb ≈256px, preview ≈1600px (WEBP/JPEG); upload lên `rawvault-derivatives`; cập nhật `files` (storage_key_thumb, storage_key_preview, preview_status, error_code) và `preview_jobs` (status, last_error_code).
- **Failure:** set `preview_status = failed`, `error_code` theo taxonomy (unsupported_raw, conversion_error, timeout, storage_error, invalid_file). MVP best-effort; format quá nặng → unsupported_raw.
- Edge Function giới hạn (memory, wall clock): thiết kế async, best-effort, có retry/attempts.

### 2.6 Trash & lifecycle

- Soft delete: set `deleted_at` trên folders/files; không xoá storage ngay.
- "Empty Trash": xoá object storage (original + derivatives) — MVP có thể làm background job (ghi rõ trong docs).

### 2.7 Logging

- Log structured: job start/finish, file_id, error_code.
- Thêm requestId/correlation id theo skill logging-observability.

---

## 3. Error taxonomy (chuẩn)

- `unsupported_raw`
- `conversion_error`
- `timeout`
- `storage_error`
- `invalid_file`

---

## 4. Output bắt buộc (theo Team Protocol)

- **Files changed** — migrations, schema, storage policy scripts, job processor/Edge Function (path).
- **Reason and scope** — mô tả ngắn: bảng nào, bucket nào, job làm gì.
- **How to test** — chạy migration, rollback; tạo folder/file thử; trigger job và kiểm tra thumb/preview trong DB và storage.
- **Migration plan + rollback steps** — theo skill db-migrations.
- **Skills applied + Evidence** — db-migrations (một migration một thay đổi, rollback); logging-observability (requestId/correlation id).

---

## 5. Handoff

- API route gọi job run hoặc signed URL → handoff **backend-a** nếu cần contract (body/response).
- Frontend cần field mới (metadata, preview_status) → cập nhật contract hoặc handoff **frontend** với mô tả.
