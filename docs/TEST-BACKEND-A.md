# Test Backend-A — RawVault API

## Chuẩn bị

1. Cấu hình `.env.local` theo `.env.example`.
2. Chạy migrations (backend-b) — bảng `folders`, `files`, `preview_jobs` phải tồn tại.
3. Tạo buckets Supabase Storage: `rawvault-original`, `rawvault-derivatives`.
4. Chạy `npm run dev`.

## Các bước kiểm tra

### 1. Auth

```bash
# Signup (password)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"method":"password","email":"test@example.com","password":"password123"}'

# Login (password) — response chứa session cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"method":"password","email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

Lưu cookies từ response để dùng cho các request tiếp theo (option `-b cookies.txt`).

### 2. Folders

```bash
# Tạo folder
curl -X POST http://localhost:3000/api/folders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Shoot 2026-02-10"}'

# List folders
curl "http://localhost:3000/api/folders?parentId=root" -b cookies.txt
```

### 3. Upload sign

```bash
# Lấy signed upload URLs (thay FOLDER_ID bằng id folder vừa tạo)
curl -X POST http://localhost:3000/api/uploads/sign \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "folderId":"FOLDER_ID",
    "files":[{"name":"test.raw","size":1000000,"mime":"image/x-raw"}]
  }'
```

### 4. Files CRUD

```bash
# Tạo file metadata (sau khi upload lên signed URL, dùng storage_key từ response sign)
curl -X POST http://localhost:3000/api/files \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "folderId":"FOLDER_ID",
    "name":"test.raw",
    "ext":"raw",
    "mime":"image/x-raw",
    "size_bytes":1000000,
    "storage_key_original":"USER_ID/FOLDER_ID/UUID.raw"
  }'

# List files
curl "http://localhost:3000/api/files?folderId=FOLDER_ID&limit=20&offset=0" -b cookies.txt

# PATCH rename
curl -X PATCH http://localhost:3000/api/files/FILE_ID \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"renamed.raw"}'

# Signed URL
curl "http://localhost:3000/api/files/FILE_ID/signed-url?variant=original" -b cookies.txt

# Share link
curl -X POST http://localhost:3000/api/share/FILE_ID -b cookies.txt

# Soft delete
curl -X DELETE http://localhost:3000/api/files/FILE_ID -b cookies.txt
```

### 5. Preview jobs

```bash
curl -X POST http://localhost:3000/api/jobs/preview/run -b cookies.txt
```

### 6. Validation & error

```bash
# 401 unauthenticated
curl -X GET http://localhost:3000/api/files

# 400 validation
curl -X POST http://localhost:3000/api/uploads/sign \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"folderId":"invalid","files":[]}'
```

## Rate limiting

- `POST /api/uploads/sign`: 30 requests / phút / user
- `POST /api/share/:fileId`: 20 requests / phút / user
