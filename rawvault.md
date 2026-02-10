# PRD v1.1 (MVP) — RawVault

**Drive-lite cho ảnh RAW**: lưu trữ file như Google Drive, tối ưu **thumbnail + preview** cho RAW, UI premium.

## 1) Mục tiêu

### Goals

1. Upload & lưu trữ file (ưu tiên RAW) an toàn (private), theo user.
2. UX “Drive-like nhưng premium”: grid/list mượt, search/sort, viewer đẹp.
3. RAW preview pipeline: tạo **thumb 256px** + **preview 1600px** (WEBP/JPEG), hiển thị nhanh.
4. Share link read-only qua **signed URL** (expire).

### Definition of Done (MVP)

* User đăng nhập → tạo folder → upload 10 file RAW (20–50MB) → thấy thumbnail/processing → mở viewer xem preview/ tải original.
* Grid/list không layout shift lớn, có skeleton + empty state.
* RLS đúng: user chỉ thấy file của mình.

---

## 2) Scope và Non-Goals

### In-Scope (MVP)

#### Authentication
Hỗ trợ đăng nhập/đăng ký người dùng bằng email (magic link) hoặc mật khẩu.

#### Folder & Navigation
Cấu trúc thư mục cơ bản (1–2 cấp) với breadcrumbs để định vị nhanh vị trí trong Drive-like hierarchy.

#### File Upload
Cho phép người dùng upload nhiều file cùng lúc, kèm tiến độ upload trực quan.

#### File Metadata
Lưu và hiển thị metadata file bao gồm: tên, kích thước, loại MIME, và các thông tin EXIF cơ bản (nếu có).

#### Preview Pipeline (Async)
Hệ thống tạo thumbnail và preview cho ảnh, hoạt động bất đồng bộ:
- Thumbnail (≈256px) dùng cho grid/list view.
- Preview lớn (≈1600px) dùng trong viewer.
- Có trạng thái “processing”, “ready”, hoặc “failed” rõ ràng.

#### File Viewer
Khi chọn file:
- Hiển thị preview tối ưu (fit-to-screen).
- Zoom cơ bản.
- Download file gốc.
- Copy share link nhanh cho người khác.

#### Share Links
Cho phép tạo share link cho file và folder với quyền read-only, bao gồm:
- Share file (preview + download nếu được phép).
- Share folder (danh sách nội dung + preview).

#### Recent & Starred Views
Danh sách file/folder gần đây và file được đánh dấu yêu thích.

#### Trash & Recover
Xoá file/folder vào Trash (soft delete), và có thể phục hồi từ Trash.

#### Responsive UI & Feedback
Giao diện responsive (desktop ưu tiên, mobile tương thích), với toast thông báo, skeleton loading, empty state, và keyboard shortcuts cơ bản (esc, enter).

### Out of Scope (MVP)

---

## 3) UX/Frontend requirements (nặng frontend)

### Layout

* **Sidebar**: My Drive, Recent, Trash, Settings
* **Top bar**: Search, Upload button, user menu
* **Main**: breadcrumbs + action bar + grid/list toggle

### View Modes Contract (để dev không đoán)

* **Grid**: thumb, filename, badges (RAW), updated_at (nhỏ)
* **List**: icon/thumb nhỏ + name + size + updated_at + kebab actions
* **Viewer**: preview lớn + panel metadata (EXIF, size, type), download, share

### A11y tối thiểu

* Tab focus được item; Enter mở viewer; Esc đóng viewer/dialog.
* Toast & dialog có aria labels.

### Performance budget (MVP)

* Lazy-load thumbnails theo viewport.
* Virtualize list nếu > 500 items (optional, chỉ bật khi cần).
* Viewer module lazy import.

**Lý do**: Next.js `<Image>` giúp size optimization + lazy loading + tránh layout shift (visual stability). ([Next.js][1])

---

## 4) RAW Preview Strategy (progressive + fallback)

### 3-level preview

1. **Placeholder** ngay lập tức: icon RAW + “Processing…” (hoặc “Unsupported”).
2. **Thumb (256px)**: dùng cho grid/list.
3. **Preview (1600px)**: dùng cho viewer.

### Preview SLA (kỳ vọng sản phẩm, để QA đo)

* Thumb: **3–5s** (best-effort)
* Preview: **10–20s** (best-effort)
* Nếu quá lâu → vẫn usable vì UI có state `processing` + retry.

### Fallback rules

* Nếu không tạo preview được: `preview_status = failed` + `error_code`

  * UI: icon RAW + metadata + nút retry + vẫn download original.

### Lưu ý giới hạn Edge Functions (ảnh hưởng thiết kế MVP)

Supabase Edge Functions có giới hạn tài nguyên (vd memory 256MB, wall clock 150s free / 400s paid, CPU time per request rất thấp). ([Supabase][2])
=> MVP phải thiết kế **async + best-effort**, và chấp nhận “unsupported_raw” cho format quá nặng/khó decode trong runtime.

---

## 5) Data model (Postgres)

### Tables

**folders**

* `id` uuid pk
* `owner_id` uuid (auth uid)
* `parent_id` uuid null
* `name` text
* `path` text (materialized path, MVP-friendly)
* `created_at`, `updated_at`
* `deleted_at` null

**files**

* `id` uuid pk
* `owner_id` uuid
* `folder_id` uuid
* `name` text
* `ext` text
* `mime` text
* `size_bytes` bigint
* `storage_key_original` text
* `storage_key_thumb` text null
* `storage_key_preview` text null
* `preview_status` enum: `pending|processing|ready|failed`
* `error_code` text null (taxonomy bên dưới)
* `metadata` jsonb null (EXIF + width/height/taken_at/camera)
* `created_at`, `updated_at`
* `deleted_at` null

**preview_jobs** (MVP queue)

* `id` uuid pk
* `file_id` uuid fk
* `owner_id` uuid
* `status` enum: `pending|processing|done|failed`
* `attempts` int
* `last_error_code` text null
* `created_at`, `updated_at`

### Error taxonomy (chuẩn hoá)

* `unsupported_raw`
* `conversion_error`
* `timeout`
* `storage_error`
* `invalid_file`

---

## 6) Storage design (Supabase Storage)

### Buckets

* `rawvault-original` (private)
* `rawvault-derivatives` (private)

Supabase Storage tích hợp Postgres RLS cho access control và policy linh hoạt. ([Supabase][3])
Supabase Storage “Files buckets” hỗ trợ CDN delivery, RLS integration (tuỳ cấu hình), phù hợp media library. ([Supabase][4])

### Signed URLs

* Viewer/list dùng **signed URL** cho `thumb|preview|original` (expire theo PRD).
  Supabase JS có `createSignedUrl(s)` để tạo signed link. ([Supabase][5])

### Signed upload (MVP upload flow mượt + an toàn)

* Client xin **signed upload URL** rồi upload trực tiếp vào bucket; token valid 2 giờ. ([Supabase][6])
  => giảm load server, không lộ service key.

---

## 7) Processing pipeline (MVP)

### Upload flow

1. Client chọn folder, chọn file(s).
2. Client gọi API `POST /api/uploads/sign` → nhận signed upload URLs.
3. Client upload trực tiếp vào `rawvault-original`.
4. Client gọi `POST /api/files` tạo metadata row (`preview_status=pending`) + tạo `preview_jobs` pending.
5. Orchestrator backend kick job: `POST /api/jobs/preview/run` (hoặc scheduled trigger) → Edge Function xử lý pending jobs.

### Derivative generation (Edge Function)

* Input: file_id, storage_key_original
* Output: upload `thumb` + `preview` lên `rawvault-derivatives`, update `files.*` và job status.
* Nếu fail: set `error_code` + `preview_status=failed`.

> MVP chấp nhận: chỉ “best-effort” cho RAW; nếu decode khó → `unsupported_raw`.

---

## 8) API (Next.js Route Handlers)

### Core

* `POST /api/uploads/sign` → signed upload URLs cho danh sách file
* `POST /api/files` → insert metadata + create preview_job
* `GET /api/files` → list theo folder + query + sort + filter type
* `PATCH /api/files/:id` → rename / move
* `DELETE /api/files/:id` → soft delete
* `POST /api/jobs/preview/run` → trigger process pending jobs (MVP manual trigger hoặc cron)
* `GET /api/files/:id/signed-url?variant=thumb|preview|original` → tạo signed URL

### Share

* `POST /api/share/:fileId` → tạo signed URL (read-only) TTL 15–60 phút (config)

---

## 9) Security

* Buckets private + signed URL.
* RLS cho `folders/files/preview_jobs`: `owner_id = auth.uid()`.
* Validate file size/ext allowlist (client + server).
* Basic rate limiting cho endpoints “sign” và “share”.

---

## 10) Trash & lifecycle (để tránh orphan)

* Soft delete: set `deleted_at`, vẫn giữ original+derivatives.
* “Empty Trash”: xoá storage objects cả original+derivatives (MVP có thể làm background).

---

## 11) Observability (MVP)

* Log structured: upload sign, metadata insert, preview job start/finish, error_code.
* Gate report tối thiểu: lint + test + secret scan (match pipeline hooks của bạn).

---

## 12) Acceptance Criteria (MVP)

* Upload 10 RAW → list hiển thị placeholder ngay, thumb xuất hiện dần.
* Viewer mở nhanh: nếu preview ready thì load preview, nếu not thì “processing” + retry.
* Signed URL hoạt động đúng TTL.
* RLS: user A không xem được file user B.
* UI: grid/list toggle, skeleton/empty states, responsive cơ bản.

---

## 13) Demo scenario (để QA + review nhanh)

1. Login
2. Create folder “Shoot 2026-02-10”
3. Upload 3 RAW (1 file cố tình fail/unsupported)
4. Grid: 2 thumbs + 1 fallback
5. Open viewer: preview + metadata panel
6. Copy share link → open incognito (read-only) → download original
