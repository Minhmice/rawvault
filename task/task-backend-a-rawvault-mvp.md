# Task: Backend-A — RawVault MVP (API, Auth, Validation)

**Route id:** api_endpoint  
**Owner:** backend-a  
**Skills required:** api-patterns, logging-observability  
**Skills suggested:** security-audit  
**Gates required:** qa, security, docs  

**Source:** PRD v1.1 — `rawvault.md` (sections 1–2, 7–9).

---

## 1. Mục tiêu

Triển khai toàn bộ API Next.js Route Handlers cho RawVault MVP: auth, signed upload, files CRUD, signed URL, preview job trigger, share. Đảm bảo error shape thống nhất, validation đầu vào, và logging có requestId.

---

## 2. Phạm vi công việc

### 2.1 Authentication

- Hỗ trợ đăng nhập/đăng ký: **email (magic link)** hoặc **mật khẩu**.
- Session / JWT theo stack hiện tại (Supabase Auth nếu dùng Supabase).
- Các route API phải kiểm tra `auth.uid()`; trả 401 nếu chưa đăng nhập.

### 2.2 API Core (Next.js Route Handlers)

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/uploads/sign` | Trả về signed upload URLs cho danh sách file; token valid 2h. Body: `{ folderId, files: [{ name, size, mime }] }`. Validate size/ext allowlist (client + server). |
| POST | `/api/files` | Insert metadata vào `files` (`preview_status=pending`) + tạo bản ghi `preview_jobs` pending. Body: folderId, name, ext, mime, size_bytes, storage_key_original. |
| GET | `/api/files` | List theo folder + query + sort + filter type. Hỗ trợ `limit`, `offset` (hoặc cursor); trả `data`, `total`, `hasMore`. RLS: chỉ trả file của user. |
| PATCH | `/api/files/:id` | Rename / move file. |
| DELETE | `/api/files/:id` | Soft delete (set `deleted_at`). |
| GET | `/api/files/:id/signed-url?variant=thumb\|preview\|original` | Tạo signed URL (expire theo config). Chỉ trả URL nếu file thuộc user (hoặc share hợp lệ). |
| POST | `/api/jobs/preview/run` | Trigger xử lý pending preview jobs (MVP: manual hoặc cron). Gọi logic/Edge Function xử lý queue. |

### 2.3 API Share

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/share/:fileId` | Tạo signed URL read-only, TTL 15–60 phút (config). Trả link để share. |

### 2.4 Folders (nếu nằm trong ownership backend-a)

- `POST /api/folders` — tạo folder (owner_id, parent_id, name, path).
- `GET /api/folders` — list theo parent + breadcrumbs (materialized path).
- `PATCH /api/folders/:id` — rename / move.
- `DELETE /api/folders/:id` — soft delete.

*(Nếu folders do backend-b phụ trách persistence, backend-a chỉ cần route gọi service/DB — điều phối theo handoff.)*

### 2.5 Validation & Error shape

- **Error schema cố định:** `{ "error": { "code": string, "message": string, "details?: unknown } }`.
- Validate toàn bộ input (query, body, params); trả 400 khi lỗi validation.
- File: allowlist extension, max size (ví dụ 50MB cho RAW); trả 400 nếu vượt hoặc type không cho phép.
- **Rate limiting:** áp dụng cho `POST /api/uploads/sign` và `POST /api/share/:fileId` (basic, theo skill security-audit nếu có).

### 2.6 Logging & observability

- Log structured: upload sign, metadata insert, preview job start/finish, error_code.
- Thêm `requestId` (hoặc correlation id) vào log theo skill logging-observability.

---

## 3. Contract API (tóm tắt)

- **List:** `GET /api/files?folderId=...&limit=20&offset=0` → `{ data: File[], total, hasMore }`.
- **Errors:** 4xx/5xx với body `{ error: { code, message, details? } }`; không lộ stack trace production.
- **Pagination:** limit (default + max cap), offset hoặc cursor; luôn trả metadata phân trang.

---

## 4. Security (quick review)

- Buckets private; mọi URL đều signed, không lộ service key.
- RLS: mọi truy vấn folders/files/preview_jobs phải filter `owner_id = auth.uid()` (hoặc tương đương).
- Validate file size + ext allowlist ở server.
- Rate limit cho sign và share.

---

## 5. Output bắt buộc (theo Team Protocol)

- **Files changed** — danh sách file sửa/thêm (route handlers, middleware, validation).
- **Reason and scope** — mô tả ngắn thay đổi và lý do.
- **How to test** — lệnh/ bước kiểm tra từng nhóm endpoint (curl hoặc test script).
- **Skills applied + Evidence** — ví dụ: api-patterns (error shape, pagination); logging-observability (requestId trong log).

---

## 6. Handoff

- Nếu cần sửa schema/migration hoặc job processor → tạo handoff cho **backend-b** (path, lý do, test step).
- Nếu cần thay đổi UI/contract → handoff **frontend** với contract mới.
