# Task: Frontend — RawVault MVP (Layout, Drive, Upload, Viewer, Share)

**Route id:** ui_feature  
**Owner:** frontend  
**Skills required:** ui-patterns, test-playbook  
**Skills suggested:** api-patterns  
**Gates required:** qa, docs  

**Source:** PRD v1.1 — `rawvault.md` (sections 1–4, 12, 13).

---

## 1. Mục tiêu

Xây giao diện Drive-like premium cho RawVault MVP: layout (sidebar, top bar, main), grid/list, upload với tiến độ, viewer với preview/metadata/download/share, skeleton & empty state, responsive và a11y cơ bản.

---

## 2. Phạm vi công việc

### 2.1 Layout

- **Sidebar:** My Drive, Recent, Trash, Settings (điều hướng rõ ràng).
- **Top bar:** Search, Upload button, user menu.
- **Main:** breadcrumbs + action bar + grid/list toggle.

### 2.2 View modes (contract với backend)

- **Grid:** thumb, filename, badges (RAW), updated_at (nhỏ). Lazy-load thumb theo viewport.
- **List:** icon/thumb nhỏ + name + size + updated_at + kebab actions.
- **Viewer:** preview lớn (fit-to-screen) + panel metadata (EXIF, size, type), nút download, copy share link. Zoom cơ bản. Nếu preview chưa ready: hiển thị "Processing…" + retry; fallback icon RAW + metadata + download original.

### 2.3 States & feedback

- **Placeholder ngay khi upload:** icon RAW + "Processing…" (hoặc "Unsupported" khi preview_status = failed).
- **Thumb (256px)** cho grid/list; **Preview (1600px)** trong viewer — dùng signed URL từ API.
- **Skeleton loading** cho list/grid; **empty state** khi không có file/folder.
- **Toast** cho thông báo (upload xong, lỗi, copy link thành công). Dialog có aria labels.

### 2.4 Upload flow (UI)

1. User chọn folder, chọn file(s).
2. Gọi `POST /api/uploads/sign` → nhận signed URLs.
3. Upload trực tiếp lên storage; hiển thị **tiến độ upload** từng file.
4. Gọi `POST /api/files` tạo metadata; hiển thị item trong list với trạng thái processing.
5. Khi preview job xong (poll hoặc realtime nếu có): cập nhật thumb/preview.

### 2.5 File viewer

- Mở bằng click (hoặc Enter khi focus item).
- Hiển thị preview (signed URL) nếu `preview_status = ready`; nếu pending/processing → "Processing…" + retry; nếu failed → icon + metadata + download original.
- Panel metadata: EXIF, size, type.
- Nút Download (original), Copy share link (gọi `POST /api/share/:fileId` rồi copy link).
- **Esc** đóng viewer.

### 2.6 Recent & Starred

- View "Recent": danh sách file/folder gần đây (API hỗ trợ nếu có).
- View "Starred": file đánh dấu yêu thích (cần API hoặc local state tùy scope).

### 2.7 Trash & Recover

- Trash view: danh sách file/folder đã xoá (soft delete).
- Hành động: Recover (restore), Empty Trash (xoá hẳn — theo API).

### 2.8 Responsive & A11y

- Desktop ưu tiên; mobile tương thích.
- **A11y tối thiểu:** Tab focus item; Enter mở viewer; Esc đóng viewer/dialog. Toast & dialog có aria labels.
- Performance: lazy-load thumbnails; viewer module lazy import; virtualize list nếu > 500 items (optional).

### 2.9 Auth UI

- Màn đăng nhập/đăng ký: magic link (email) hoặc mật khẩu theo API auth đã có.
- Sau login → redirect vào My Drive.

---

## 3. Contract với API (tóm tắt)

- `GET /api/files?folderId=...&limit=&offset=` → list file; mỗi item có preview_status, storage_key_* (hoặc dùng signed-url endpoint).
- `GET /api/files/:id/signed-url?variant=thumb|preview|original` → URL để hiển thị.
- `POST /api/share/:fileId` → link share read-only.
- Upload: `POST /api/uploads/sign` → signed URLs; `POST /api/files` → tạo metadata + job.

---

## 4. Definition of Done (MVP) — kiểm tra cùng QA

- User đăng nhập → tạo folder → upload 10 file RAW (20–50MB) → thấy thumbnail/processing → mở viewer xem preview hoặc tải original.
- Grid/list không layout shift lớn; có skeleton + empty state.
- RLS: user chỉ thấy file của mình (kiểm tra bằng hai user).

---

## 5. Demo scenario (để QA + review)

1. Login  
2. Create folder "Shoot 2026-02-10"  
3. Upload 3 RAW (1 file cố tình fail/unsupported)  
4. Grid: 2 thumbs + 1 fallback  
5. Open viewer: preview + metadata panel  
6. Copy share link → mở incognito (read-only) → download original  

---

## 6. Output bắt buộc (theo Team Protocol)

- **Files changed** — danh sách component, page, store/hook.
- **Reason and scope** — mô tả thay đổi và phạm vi.
- **How to test** — bước kiểm tra thủ công hoặc test script (test-playbook).
- **Skills applied + Evidence** — ui-patterns (loading/error/empty, a11y); test-playbook (test plan hoặc test case cho critical path).

---

## 7. Handoff

- Cần API mới hoặc thay đổi response (field, pagination) → handoff **backend-a** với mô tả contract.
- Cần thêm field DB hoặc job status → handoff **backend-b** với mô tả.
