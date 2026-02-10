# Frontend RawVault MVP — Output (Team Protocol)

**Task:** task-frontend-rawvault-mvp.md  
**Owner:** frontend  
**Skills required:** ui-patterns, test-playbook | **Suggested:** api-patterns  
**Gates:** qa, docs  

---

## 1. Files changed

### New files
- `postcss.config.mjs` — PostCSS + Tailwind
- `src/app/globals.css` — Tailwind import + theme variables
- `src/lib/supabase-client.ts` — Browser Supabase client for auth
- `src/types/api.ts` — FileItem, ListFilesResponse, FolderItem, SignedUrlResponse, ShareResponse
- `src/components/ui/Toast.tsx` — Toast notifications (aria-live, role="alert")
- `src/hooks/useToast.ts` — Toast state
- `src/components/layout/Sidebar.tsx` — Nav: My Drive, Recent, Trash, Settings
- `src/components/layout/TopBar.tsx` — Search (optional), Upload button, user menu
- `src/components/layout/DashboardShell.tsx` — Layout wrapper: Sidebar + TopBar + Toast
- `src/components/drive/FileGrid.tsx` — Grid view, thumb lazy-load, skeleton, empty state
- `src/components/drive/FileList.tsx` — List view, skeleton, empty state
- `src/components/drive/FileViewer.tsx` — Preview panel, metadata, download, share link, zoom, Esc to close
- `src/components/drive/UploadDialog.tsx` — Choose files → sign → upload with progress → POST /api/files
- `src/app/(dashboard)/layout.tsx` — Auth check, redirect to /login if not signed in
- `src/app/(dashboard)/drive/page.tsx` — Drive: breadcrumbs, folders, grid/list, viewer, upload
- `src/app/(dashboard)/recent/page.tsx` — Placeholder (Recent)
- `src/app/(dashboard)/trash/page.tsx` — Placeholder (Trash)
- `src/app/(dashboard)/settings/page.tsx` — Placeholder (Settings)
- `src/app/login/page.tsx` — Login (password + magic link)
- `src/app/signup/page.tsx` — Sign up (password + magic link)

### Modified files
- `src/app/layout.tsx` — DM Sans font, globals.css, body classes
- `src/app/page.tsx` — Redirect: authenticated → /drive, else → /login

---

## 2. Reason and scope

- **Scope:** RawVault MVP UI per PRD v1.1 (sections 1–4, 12, 13): Drive-like layout, grid/list, upload with progress, viewer with preview/metadata/download/share, skeleton & empty state, responsive, a11y basics, auth (login/signup → redirect to My Drive).
- **Contract:** Uses existing API: GET/POST /api/files, GET /api/files/:id/signed-url, POST /api/share/:fileId, POST /api/uploads/sign, GET/POST /api/folders. Error shape `{ error: { code, message, details? } }` assumed.
- **Out of scope in this pass:** Recent/Trash/Settings real data (placeholders); list virtualization >500 items; EXIF in viewer (backend may add `metadata` to file response later).

---

## 3. How to test

### Prerequisites
- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (and DB/migrations applied).
- Backend APIs and Supabase Auth enabled (magic link + password).

### Manual test (Demo scenario — task §5)
1. **Login** — Open `/login`, sign in (password or request magic link).
2. **Redirect** — After login, should redirect to `/drive`.
3. **Create folder** — On Drive, click "New folder" → folder appears; select it.
4. **Upload** — Click "Upload" in top bar → choose 2–3 image/RAW files → Upload → see progress → items appear in list with "Processing…" or thumb when ready.
5. **Grid/List** — Toggle Grid vs List; no large layout shift; skeleton while loading; empty state when no files.
6. **Viewer** — Click a file → viewer opens with preview (or "Processing…" / "Unsupported") and metadata panel; Download original, Copy share link; press **Esc** to close.
7. **Share** — Copy share link → open in incognito → link works (read-only download).
8. **A11y** — Tab through sidebar and file items; Enter on focused file opens viewer; Esc closes viewer/dialog; toasts and dialog have aria labels.

### Commands
- `npm run dev` — run app, then follow steps above.
- Full build: `npm run build` — note: build may fail on `workers/preview/processor.ts` (backend); frontend `src/app` and `src/components` compile successfully.

---

## 4. Skills applied + Evidence

| Skill | Evidence |
|-------|----------|
| **ui-patterns** | Loading/error/empty: skeleton for grid and list; empty state copy + CTA; "Processing…" / "Unsupported" for preview_status; toast for success/error. Semantic HTML and ARIA: `role="main"`, `aria-label` on nav/dialog/toast, `aria-live="polite"` on toast, `role="dialog"` on viewer/upload; focus order and Esc/Enter (Enter opens viewer, Esc closes). |
| **test-playbook** | Test plan above (manual demo scenario); critical path: login → create folder → upload → grid/list → viewer → share. No automated tests added in this change; test plan and DoD documented for QA. |
| **api-patterns** | Frontend assumes stable error shape `{ error: { code, message, details? } }`; uses existing list pagination (limit/offset) and signed-url variant. |

---

## 5. Handoff

- **Recent / Trash / Starred:** When backend provides list endpoints for recent or deleted items, frontend can replace placeholders (handoff backend-a if contract needed).
- **EXIF in viewer:** If backend adds `metadata` (e.g. EXIF) to `GET /api/files` or `GET /api/files/:id`, frontend can show it in the viewer metadata panel (handoff backend-a for contract).
- **Build:** Full repo build fails in `workers/preview/processor.ts` (thumbBuf); frontend-only code builds; handoff to owner of that worker if needed.
