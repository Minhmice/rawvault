# Backend-A Task Output — RawVault MVP

## Files changed

### Added

- `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts` — Next.js project setup
- `src/lib/api-error.ts` — Stable error schema `{ error: { code, message, details? } }`
- `src/lib/logger.ts` — Structured logging with requestId
- `src/lib/supabase.ts` — Supabase client (anon + service role)
- `src/lib/auth.ts` — getServerUser, getSupabaseServerClient (cookie-based session)
- `src/lib/validation.ts` — Zod schemas (SignUpload, CreateFile, ListFiles, PatchFile, SignedUrl, Folders)
- `src/lib/rate-limit.ts` — In-memory rate limiter for sign/share
- `src/app/layout.tsx`, `src/app/page.tsx` — App shell
- `src/app/api/auth/login/route.ts` — Login (password + magic link)
- `src/app/api/auth/signup/route.ts` — Signup (password + magic link)
- `src/app/api/auth/logout/route.ts` — Logout
- `src/app/api/uploads/sign/route.ts` — POST signed upload URLs
- `src/app/api/files/route.ts` — GET list, POST create
- `src/app/api/files/[id]/route.ts` — PATCH rename/move, DELETE soft delete
- `src/app/api/files/[id]/signed-url/route.ts` — GET signed URL (thumb|preview|original)
- `src/app/api/jobs/preview/run/route.ts` — POST trigger preview jobs
- `src/app/api/share/[fileId]/route.ts` — POST share link
- `src/app/api/folders/route.ts` — GET list, POST create
- `src/app/api/folders/[id]/route.ts` — PATCH rename/move, DELETE soft delete
- `.env.example` — Env template
- `docs/API-BACKEND-A.md` — API overview
- `docs/TEST-BACKEND-A.md` — Test steps

## Reason and scope

Triển khai toàn bộ API Next.js Route Handlers cho RawVault MVP theo task backend-a: auth (magic link + password), signed upload, files CRUD, signed URL, preview job trigger, share, folders. Validation đầu vào (Zod), error shape thống nhất, logging có requestId, rate limiting cho sign/share.

## How to test

1. Cấu hình `.env.local` từ `.env.example` (Supabase URL, keys).
2. Chạy migrations (backend-b) — tables `folders`, `files`, `preview_jobs`.
3. Tạo buckets: `rawvault-original`, `rawvault-derivatives`.
4. `npm run dev` → xem `docs/TEST-BACKEND-A.md` cho các lệnh curl.

## Skills applied + Evidence

- **api-patterns**: Error shape cố định `{ error: { code, message, details? } }`; pagination `{ data, total, hasMore }`; validation toàn bộ input; nouns + HTTP verbs.
- **logging-observability**: Structured JSON logs; `requestId` từ header `x-request-id` hoặc `crypto.randomUUID()`; log upload sign, metadata insert, preview job, error_code.
- **security-audit**: Auth check mọi route (401 nếu chưa đăng nhập); validate/sanitize input; rate limit sign + share; không lộ stack trace; service key chỉ server-side.

## Note

- **TopBar.tsx**: Sửa JSX (wrap label+input trong fragment) để build pass — ownership frontend, minimal fix để unblock.
- **Build**: Build đầy đủ có thể fail do `workers/preview/processor.ts` (backend-b) — biến `thumbBuf`/`previewBuf` ngoài scope. Handoff backend-b: di chuyển `thumbUpload`/`previewUpload` vào trong try block sau `Promise.all`.
