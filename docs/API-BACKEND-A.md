# RawVault API (Backend-A)

## Môi trường

Copy `.env.example` thành `.env.local` và cấu hình Supabase:

- `NEXT_PUBLIC_SUPABASE_URL` — URL dự án Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (chỉ server-side)
- `SUPABASE_EDGE_FUNCTION_PREVIEW_URL` — (Optional) URL Edge Function xử lý preview jobs

## Các endpoint

### Auth

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/auth/login` | Đăng nhập: body `{ method: "password"|"magic_link", email, password? }` |
| POST | `/api/auth/signup` | Đăng ký: body `{ method: "password"|"magic_link", email, password? }` |
| POST | `/api/auth/logout` | Đăng xuất |

### Files

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/uploads/sign` | Signed upload URLs: body `{ folderId, files: [{ name, size, mime }] }` |
| POST | `/api/files` | Tạo file metadata + preview job |
| GET | `/api/files?folderId=&limit=20&offset=0&sort=&order=` | List files |
| PATCH | `/api/files/:id` | Rename / move |
| DELETE | `/api/files/:id` | Soft delete |
| GET | `/api/files/:id/signed-url?variant=thumb|preview|original` | Signed URL |

### Folders

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/folders` | Tạo folder |
| GET | `/api/folders?parentId=` | List folders |
| PATCH | `/api/folders/:id` | Rename / move |
| DELETE | `/api/folders/:id` | Soft delete |

### Share & Jobs

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/share/:fileId` | Tạo share link (signed URL read-only, TTL 30 phút) |
| POST | `/api/jobs/preview/run` | Trigger xử lý pending preview jobs |

## Error shape

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": {}
  }
}
```

## Test

Xem `docs/TEST-BACKEND-A.md`.
