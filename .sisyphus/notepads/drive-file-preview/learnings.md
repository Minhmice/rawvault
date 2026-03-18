## [2026-03-18] Session ses_30125f4afffe34MgJzqBV4nlUu — Codebase Scan

### Worktree
/Users/minhmice/Documents/Projects/rawvault/.claude/worktrees/drive-file-preview

### Contract Pattern (MUST FOLLOW)
- Zod schema first, then `z.infer<typeof schema>` for types
- File: `lib/contracts/preview.contracts.ts`
- Export from barrel: `lib/contracts/index.ts` (add `export * from "./preview.contracts"`)
- See `lib/contracts/drive-browse.contracts.ts` for exact style

### ExplorerFile shape (from lib/contracts/explorer.contracts.ts)
- id, folderId, name, ext (nullable), mime (nullable), sizeBytes, provider, storageAccountId, previewStatus, syncStatus, errorCode, createdAt, updatedAt
- NO providerFileId in ExplorerFile — it's in the DB row but not exposed in list response
- For preview: use `/api/files/{id}/stream` route (server-side, auth via cookie)

### Stream route
- `app/api/files/[id]/stream/route.ts` — returns inline Content-Disposition
- Returns 403 for split files or viewer_mode=download_only
- Auth via cookie session (no token in URL)

### Drive list service
- `lib/storage-accounts/drive/list.service.ts` — fields: `id,name,mimeType,size`
- DriveBrowseItem: { id, name, isFolder, mimeType, sizeBytes }
- NO webViewLink or thumbnailLink currently

### Theme system
- 4 themes: vivid, monochrome, bauhaus, linear
- `useThemeComponents()` from `components/themes/index.tsx` → { ThemeCard, ThemeButton, ThemeInput }
- `useTheme()` from `components/theme-provider/ThemeProvider.tsx` → { theme }
- theme.name is the ThemeName string

### i18n
- `useLocale()` from `components/i18n/LocaleProvider.tsx` → { t }
- Keys defined in `lib/i18n/messages.ts` as MessageKey union type
- Add new keys to MessageKey union AND to both locale objects (en + vi)

### No test harness yet
- No vitest.config.ts in worktree
- No @testing-library packages installed
- Task 4 must install: vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom

### Path alias
- `@/*` → `./*` (project root)

### FileGrid click behavior
- Regular files: onClick does nothing (no preview wired yet)
- split/download-only: onClick triggers download
- Insertion point: add `onPreview?: (file: ExplorerFile) => void` prop
