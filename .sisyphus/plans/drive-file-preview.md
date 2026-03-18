# Drive File Preview Plan

## TL;DR
> Add a themed in-app preview overlay for Drive-backed files.
> 
> MVP supports: images (png/jpg/etc), PDF, RAW (embedded JPEG preview), audio/video (download-first), plus “Open in Google” redirects for Google Docs/Sheets/Slides.

**Estimated Effort**: Medium
**Parallel Execution**: YES (3 waves)
**Critical Path**: file-type resolver + blob lifecycle → preview overlay shell → per-type renderers → wiring into file grid

---

## Context

### Original Request
- Web app uses Google Drive as a “personal cloud storage”.
- Need a preview system for common files (png/jpeg/...) and also Google Docs/Sheets/Slides.

### Interview Summary
- **Drive calls**: currently client-side.
- **MVP preview types**: images (including some RAW), PDF, audio, video, Office files.
- **Google Docs/Sheets/Slides**: redirect to Google site (not embedded preview).
- **Streaming**: no backend proxy for MVP; audio/video download-first to view.
- **RAW preview fidelity**: embedded JPEG preview (not full RAW demosaic).
- **Tests**: YES (tests-after).

### Metis Review (key guardrails)
- Enforce **file size limits** for download-to-blob previews to avoid browser OOM.
- Ensure **blob URLs are revoked** on close/unmount; cancel in-flight downloads.
- Never embed risky formats (HTML/SVG) without sandboxing; treat as unsupported.

---

## Work Objectives

### Core Objective
Provide a reliable, themed file preview experience that works on desktop + mobile, with safe fallbacks for unsupported/oversized files.

### Concrete Deliverables
- Preview routing (file type → preview strategy) + size limits.
- Preview overlay UI with per-type renderers.
- RAW embedded JPEG preview extraction.
- Redirect handling for Google Docs/Sheets/Slides.
- Tests added after implementation (unit + minimal UI flow).

### Must NOT Have (Guardrails)
- No full RAW demosaic pipeline for MVP.
- No progressive streaming proxy for MVP (audio/video download-first only).
- No HTML/SVG inline rendering; treat as unsupported.
- No editing/annotation features (PDF annotate, image edit, etc.).

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: Assume NO (add minimal test harness)
- **Automated tests**: YES (tests-after)
- **Framework**: Recommend `vitest` + React Testing Library (unit); optional Playwright later

### QA Policy (Agent-Executed)
Every task includes runnable QA scenarios; evidence saved to `.sisyphus/evidence/`.

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Foundation: contracts, routing, test harness)
- Task 1–6

Wave 2 (UI shell + core renderers)
- Task 7–12

Wave 3 (Integration + hardening + tests)
- Task 13–18

---

## TODOs

- [x] 1. Add Preview Contracts + Types

  **What to do**:
  - Add a preview domain contract (enum/type) representing: `image | pdf | raw_embedded | audio | video | google_redirect | office_fallback | unsupported`.
  - Define a `PreviewModel` shape used by UI: `{ kind, title, sizeBytes, mimeType, actions, source }`.

  **Must NOT do**:
  - Do not bake UI concerns into contracts (keep it data-only).

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2–6)
  - **Blocks**: Tasks 2, 7–18
  - **Blocked By**: None

  **References**:
  - `lib/contracts/drive-browse.contracts.ts` - existing Zod → TS contract style to follow.
  - `types/contracts/explorer.ts` - how explorer list item types are shaped.

  **Acceptance Criteria**:
  - [x] New contract file exists and is exported from the contracts barrel (matching existing conventions).

  **QA Scenarios**:
  ```
  Scenario: Typecheck the new contracts
    Tool: Bash
    Steps:
      1. Run `npm run build`
      2. Assert TypeScript compilation succeeds
    Expected Result: build succeeds with zero TS errors
    Evidence: .sisyphus/evidence/task-1-contracts-build.txt
  ```

- [x] 2. Implement File Type Resolver + Size Limits

  **What to do**:
  - Create a single “source of truth” resolver: `(mimeType, filename) -> PreviewKind`.
  - Include explicit support for:
    - Images: `image/*` (png/jpg/jpeg/webp/gif)
    - PDF: `application/pdf` and `.pdf`
    - Audio: `audio/*` and common extensions
    - Video: `video/*` and common extensions
    - RAW: `.arw .cr2 .nef .dng .raf .orf .rw2 .pef` (configurable list)
    - Google Workspace: `application/vnd.google-apps.*` -> `google_redirect`
    - Office: `.docx .xlsx .pptx` -> `office_fallback`
  - Add per-kind size caps (defaults):
    - image/raw: 100MB
    - pdf/audio: 50MB
    - video: 200MB
  - If file exceeds size cap: treat as `unsupported` with reason `too_large`.

  **Must NOT do**:
  - Do not add full RAW decode.
  - Do not allow HTML/SVG inline preview.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 7–18
  - **Blocked By**: Task 1

  **References**:
  - `components/workspace/FileGrid.tsx` - current simplistic detection (`fileTypeFromRecord`) to replace/extend.

  **Acceptance Criteria**:
  - [x] Resolver returns stable kinds for a table of representative inputs (covered by unit tests in Task 18).
  - [x] Size caps are enforced deterministically.

  **QA Scenarios**:
  ```
  Scenario: Typecheck resolver changes
    Tool: Bash
    Steps:
      1. Run `npm run build`
    Expected Result: build succeeds with zero TS errors
    Evidence: .sisyphus/evidence/task-2-resolver-build.txt
  ```

- [x] 3. Ensure File Metadata Includes What Preview Needs

  **What to do**:
  - Ensure list/detail responses include enough metadata to:
    - classify type (mime + filename)
    - enforce size caps (sizeBytes)
    - open in Google (providerFileId or explicit `webViewLink`)
    - (optional) use Drive `thumbnailLink` if available
  - If implementing inside this repo, expand Drive list fields:
    - `lib/storage-accounts/drive/list.service.ts` currently requests only `id,name,mimeType,size`.
    - Add `thumbnailLink, webViewLink, modifiedTime` (and map them into the browse item if contracts allow).

  **Must NOT do**:
  - Do not expose OAuth tokens in responses.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 13 (redirect), improves UX for Tasks 8–12
  - **Blocked By**: Task 1

  **References**:
  - `lib/storage-accounts/drive/list.service.ts` - Drive v3 list call + `fields=` usage.
  - `lib/contracts/drive-browse.contracts.ts` - browse item schema/type.

  **Acceptance Criteria**:
  - [x] List/detail responses contain fields needed for redirect + preview routing.

  **QA Scenarios**:
  ```
  Scenario: Drive list still works after adding fields
    Tool: Bash
    Steps:
      1. Run `npm run build`
      2. Run any existing QA script that exercises Drive browse/list (project-specific)
    Expected Result: script passes; list endpoint returns 200
    Evidence: .sisyphus/evidence/task-3-drive-list-fields.txt
  ```

- [x] 4. Add Minimal Test Harness (Tests-After Foundation)

  **What to do**:
  - Add `vitest` + React Testing Library setup suitable for Next.js app components.
  - Add npm scripts: `test`, `test:watch` (if desired).
  - Add a first smoke test that runs in CI/local without provider creds.

  **Must NOT do**:
  - Do not block the app build by over-configuring.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 18
  - **Blocked By**: None

  **References**:
  - `package.json` - existing scripts; add test scripts consistently.
  - `tsconfig.json` (if present) - path alias expectations.

  **Acceptance Criteria**:
  - [x] `npm run test` exists and passes on a clean checkout.

  **QA Scenarios**:
  ```
  Scenario: Run unit tests
    Tool: Bash
    Steps:
      1. Run `npm run test`
    Expected Result: vitest reports PASS
    Evidence: .sisyphus/evidence/task-4-vitest-pass.txt
  ```

- [x] 5. Implement RAW Embedded JPEG Extraction Utility

  **What to do**:
  - Add a client-side helper that takes a RAW `Blob`/`ArrayBuffer` and attempts to extract an embedded preview JPEG.
  - Prefer a library approach (e.g. `exifr`) and wrap it behind a small adapter.
  - Return a `Blob` for the preview JPEG (or `null` if not available).
  - Include timeouts and try/catch to avoid locking the UI on corrupted files.

  **Must NOT do**:
  - No full demosaic; embedded preview only.
  - No unbounded memory growth; avoid copying buffers repeatedly.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 10
  - **Blocked By**: Task 2

  **References**:
  - `components/workspace/FileGrid.tsx` - RAW extension currently hard-coded as `.arw`.

  **Acceptance Criteria**:
  - [x] Utility returns a JPEG preview blob for at least one fixture RAW file (added as test fixture in Task 18).
  - [x] Utility returns `null` cleanly when preview not present.

  **QA Scenarios**:
  ```
  Scenario: Unit-test embedded preview extraction
    Tool: Bash
    Steps:
      1. Run `npm run test` (after Task 18 adds the tests)
      2. Verify the RAW extraction test passes
    Expected Result: extraction tests PASS
    Evidence: .sisyphus/evidence/task-5-raw-extract-tests.txt
  ```

- [x] 6. Implement Download-to-Blob Utility (Progress + Abort)

  **What to do**:
  - Build a reusable download helper that:
    - accepts a fetch request (Drive download URL or app API) and returns `{ blob, contentType }`
    - reports progress (bytes loaded / total when known)
    - supports cancellation via `AbortController`
  - Ensure all callers can cancel when closing the preview or switching files.

  **Must NOT do**:
  - Do not keep blobs around after preview closes; require callers to cleanup.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 8–12
  - **Blocked By**: Task 2

  **References**:
  - `scripts/verify-phase9-download.mjs` - patterns for verifying download behavior (if implementing in this repo).

  **Acceptance Criteria**:
  - [x] Download helper can be unit-tested with a mocked `fetch`.
  - [x] Abort cancels and surfaces a deterministic “cancelled” state.

  **QA Scenarios**:
  ```
  Scenario: Abort download in unit test
    Tool: Bash
    Steps:
      1. Run `npm run test`
      2. Verify abort test passes and does not leak timers
    Expected Result: PASS
    Evidence: .sisyphus/evidence/task-6-download-abort-test.txt
  ```

- [x] 7. Build Preview Overlay Shell (Theme-Compatible)

  **What to do**:
  - Add a preview overlay component that can open/close and render a chosen renderer.
  - Requirements:
    - Works with all themes (uses existing theme tokens/components).
    - Fullscreen or near-fullscreen layout (mobile-friendly).
    - Keyboard: `Escape` closes; focus trapped.
    - Adds stable `data-testid` hooks (overlay, close button, loading, error).

  **Must NOT do**:
  - Do not hardcode colors; rely on theme tokens.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8–12)
  - **Blocks**: Tasks 13–17
  - **Blocked By**: Task 1

  **References**:
  - `components/theme/shadcn/dialog.tsx` - dialog primitive style; may need a larger variant.
  - `components/themes/index.tsx` - `useThemeComponents()` theme proxy pattern.

  **Acceptance Criteria**:
  - [x] Overlay opens/closes reliably; closing triggers cleanup callback.
  - [x] Mobile layout fits viewport and is scroll-safe.

  **QA Scenarios**:
  ```
  Scenario: Overlay open/close (component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run components/preview/PreviewOverlay.test.tsx`
    Expected Result: test passes (open/close + Escape)
    Evidence: .sisyphus/evidence/task-7-overlay-test.txt
  ```

- [x] 8. Implement Image Preview Renderer (Download-first)

  **What to do**:
  - Renderer downloads the image (respecting size caps) and displays it with object URL.
  - Add a simple zoom (CSS scale) and “fit to screen” behavior.
  - Ensure `URL.revokeObjectURL` is called on close/unmount.

  **Must NOT do**:
  - No image editing; preview-only.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 15 (integration)
  - **Blocked By**: Tasks 2, 6, 7

  **References**:
  - Existing file card patterns: `components/workspace/FileGrid.tsx`.

  **Acceptance Criteria**:
  - [x] Image preview shows within overlay with a loading state and error fallback.
  - [x] Blob URL is revoked on close.

  **QA Scenarios**:
  ```
  Scenario: Image renderer smoke (component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run components/preview/renderers/ImagePreview.test.tsx`
    Expected Result: test passes (loading -> rendered image; blob URL revoke on cleanup)
    Evidence: .sisyphus/evidence/task-8-image-renderer-test.txt
  ```

- [x] 9. Implement PDF Preview Renderer (Download-first)

  **What to do**:
  - Renderer downloads PDF (size cap) and previews it in-app.
  - Prefer minimal approach first: `<object type="application/pdf">` or `<iframe>` pointed at object URL.
  - If the minimal approach is unreliable, switch to `pdfjs-dist` (but keep MVP scope small).

  **Must NOT do**:
  - No PDF annotations.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 2, 6, 7

  **References**:
  - Streaming route pattern (if available): `app/api/files/[id]/stream/route.ts`.

  **Acceptance Criteria**:
  - [x] PDF preview loads for a small PDF fixture.
  - [x] Oversized PDFs produce a clear “too large” fallback.

  **QA Scenarios**:
  ```
  Scenario: PDF renderer smoke (component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run components/preview/renderers/PdfPreview.test.tsx`
    Expected Result: test passes (renders PDF container; handles too-large fallback)
    Evidence: .sisyphus/evidence/task-9-pdf-renderer-test.txt
  ```

- [x] 10. Implement RAW Preview Renderer (Embedded JPEG)

  **What to do**:
  - Renderer downloads RAW file up to size cap.
  - Attempt embedded JPEG extraction (Task 5) and display it as an image.
  - If extraction fails: fallback message + Download + Open in Google (Drive).

  **Must NOT do**:
  - No full RAW decode.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 2, 5, 6, 7

  **References**:
  - RAW extension check currently in `components/workspace/FileGrid.tsx`.

  **Acceptance Criteria**:
  - [x] For a RAW fixture with embedded preview, preview renders an image.
  - [x] For a RAW fixture without embedded preview, a deterministic fallback is shown.

  **QA Scenarios**:
  ```
  Scenario: RAW renderer fallback behavior (component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run components/preview/renderers/RawPreview.test.tsx`
    Expected Result: test passes (renders embedded preview when extractor returns blob; else fallback UI)
    Evidence: .sisyphus/evidence/task-10-raw-renderer-test.txt
  ```

- [x] 11. Implement Audio Preview Renderer (Download-first)

  **What to do**:
  - Download audio to blob, then render `<audio controls>`.
  - Show download progress; allow cancel.
  - Cleanup blob on close.

  **Must NOT do**:
  - No streaming/range support for MVP.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 2, 6, 7

  **Acceptance Criteria**:
  - [x] Audio plays after download; cancel stops download.

  **QA Scenarios**:
  ```
  Scenario: Audio renderer smoke (component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run components/preview/renderers/AudioPreview.test.tsx`
    Expected Result: test passes (downloads mocked blob, renders <audio>, cleanup revokes URL)
    Evidence: .sisyphus/evidence/task-11-audio-renderer-test.txt
  ```

- [x] 12. Implement Video Preview Renderer (Download-first)

  **What to do**:
  - Download video to blob, then render `<video controls playsInline>`.
  - Show progress; allow cancel.
  - Cleanup blob on close.

  **Must NOT do**:
  - No progressive streaming for MVP.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 2, 6, 7

  **Acceptance Criteria**:
  - [x] Video plays after download; cancel stops download; `playsInline` present for iOS.

  **QA Scenarios**:
  ```
  Scenario: Video renderer smoke (component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run components/preview/renderers/VideoPreview.test.tsx`
    Expected Result: test passes (downloads mocked blob, renders <video playsInline>, cleanup works)
    Evidence: .sisyphus/evidence/task-12-video-renderer-test.txt
  ```

- [x] 13. Implement “Open in Google” Redirect Strategy

  **What to do**:
  - For `application/vnd.google-apps.*` files, show a clear “Open in Google” action.
  - Use a robust redirect URL that works across Docs/Sheets/Slides without needing MIME-specific URLs.
    - Default: `https://drive.google.com/open?id={providerFileId}` (Drive will route to the right app).
  - Avoid popup blockers by opening the link directly from a user click.

  **Must NOT do**:
  - Do not attempt to embed Google Docs/Sheets/Slides in an iframe for MVP.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 14–18)
  - **Blocks**: Task 15 integration completeness
  - **Blocked By**: Tasks 1–2, 7

  **Acceptance Criteria**:
  - [x] Workspace files do not attempt in-app preview; instead they present an external open action.

  **QA Scenarios**:
  ```
  Scenario: Workspace redirect URL + window.open (unit/component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run lib/preview/open-in-google.test.ts`
    Expected Result: test passes (correct URL; click calls window.open)
    Evidence: .sisyphus/evidence/task-13-open-in-google-test.txt
  ```

- [x] 14. Office File Preview Policy (MVP Fallback)

  **What to do**:
  - For `.docx/.xlsx/.pptx` (and other office-like files), implement a consistent fallback UI:
    - Message: “In-app preview not supported yet.”
    - Buttons: Download + Open in Google (Drive).
  - Do NOT attempt Google Docs viewer (`gview`) unless files are public (they are usually not).

  **Must NOT do**:
  - Do not add heavy Office renderers (docx/xlsx/pptx parsing) in MVP.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 2, 7

  **Acceptance Criteria**:
  - [x] Office file types route to a fallback renderer with clear actions.

  **QA Scenarios**:
  ```
  Scenario: Office fallback renderer (component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run components/preview/renderers/OfficeFallback.test.tsx`
    Expected Result: test passes (message + Download + Open in Google)
    Evidence: .sisyphus/evidence/task-14-office-fallback-test.txt
  ```

- [x] 15. Wire Preview into File List / Explorer UI

  **What to do**:
  - Add an explicit “Preview” action and/or click behavior in the file grid to open the overlay.
  - Maintain existing “download-only” behavior for split/download-only items.
  - Pass the selected file (id/provider id, name, mime, size) into the preview overlay.
  - Ensure preview respects theming and doesn’t break existing dialogs.

  **Must NOT do**:
  - Do not change existing download/stream semantics beyond adding preview UI.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential after Tasks 7–14
  - **Blocks**: Task 16–18
  - **Blocked By**: Tasks 2, 7–14

  **References**:
  - `components/workspace/FileGrid.tsx` - insertion point for click/preview actions.
  - `components/workspace/VaultClient.tsx` - likely place to host dialog state + callbacks.

  **Acceptance Criteria**:
  - [x] Clicking a normal image/pdf/raw/audio/video file opens the overlay.
  - [x] Clicking a split/download-only file continues to download instead of preview.

  **QA Scenarios**:
  ```
  Scenario: FileGrid wires preview callback (component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run components/workspace/FileGrid.preview.test.tsx`
    Expected Result: test passes (click triggers onPreview; split/download-only does not)
    Evidence: .sisyphus/evidence/task-15-filegrid-preview-test.txt
  ```

- [x] 16. Hardening: Cleanup, Concurrency, and Size Guards

  **What to do**:
  - Enforce size caps at preview start (before downloading) and show “too large” fallback.
  - Ensure only one active download at a time; opening another file cancels the previous download.
  - Revoke blob URLs on close and when switching previews.
  - Add UI states: loading, progress, cancelled, error.

  **Must NOT do**:
  - Do not silently fail; always show a user-facing fallback.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 18 quality
  - **Blocked By**: Tasks 6–12, 15

  **Acceptance Criteria**:
  - [x] Closing overlay cancels downloads and frees blob URLs.
  - [x] Oversized files never start a download.

  **QA Scenarios**:
  ```
  Scenario: Cancel download on close (component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run components/preview/PreviewOverlay.abort.test.tsx`
    Expected Result: test passes (AbortController called; blob URL revoked)
    Evidence: .sisyphus/evidence/task-16-cancel-on-close-test.txt
  ```

- [x] 17. UX Polish + i18n Strings

  **What to do**:
  - Add consistent messaging for:
    - unsupported type
    - too large
    - preview unavailable
    - token/network errors
  - Ensure labels/buttons are theme-consistent and accessible.

  **Must NOT do**:
  - Do not introduce new theme systems; use existing tokens.

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Tasks 7, 15

  **References**:
  - `lib/i18n/messages.ts` - existing text keys and message patterns.

  **Acceptance Criteria**:
  - [x] All preview UI text is centralized and consistent (and localizable if the app uses i18n).

  **QA Scenarios**:
  ```
  Scenario: Focus trap + keyboard close (component test)
    Tool: Bash
    Preconditions: Task 4 test harness is in place
    Steps:
      1. Run `npx vitest run components/preview/PreviewOverlay.a11y.test.tsx`
    Expected Result: test passes (Tab cycles within overlay; Escape closes)
    Evidence: .sisyphus/evidence/task-17-a11y-test.txt
  ```

- [x] 18. Add Tests After: Resolver + Blob Lifecycle + Renderer Smoke

  **What to do**:
  - Add unit tests for:
    - file-type resolver mappings
    - size cap enforcement
    - blob URL lifecycle (create + revoke on cleanup)
    - RAW embedded preview extraction fallback behavior (mocked)
  - Add at least one component test for overlay open/close and renderer switching.
  - Add small local fixtures for tests (PNG/PDF/MP3/MP4; and optionally a tiny RAW sample if licensing permits; otherwise mock RAW extraction).

  **Must NOT do**:
  - Do not require real Google credentials for unit tests.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Final verification
  - **Blocked By**: Tasks 1–7, 16–17

  **Acceptance Criteria**:
  - [x] `npm run test` passes.
  - [x] Key mappings are covered with a table-driven test.

  **QA Scenarios**:
  ```
  Scenario: Full unit test run
    Tool: Bash
    Steps:
      1. Run `npm run test`
    Expected Result: all tests PASS
    Evidence: .sisyphus/evidence/task-18-tests-pass.txt
  ```

---

## Final Verification Wave

- Run `npm run lint` and `npm run build`.
- Run the full test suite (vitest commands added in this work).
- Execute all QA scenarios and confirm evidence files exist in `.sisyphus/evidence/`.

---

## Commit Strategy
- Keep commits atomic by layer: test harness → routing/contracts → overlay shell → each renderer → integration → tests.

---

## Success Criteria
- Clicking a file opens a preview overlay that matches the file type.
- RAW files show an embedded JPEG preview when present, else show a clear fallback.
- Audio/video previews work via download-first with progress + cancel.
- Google Docs/Sheets/Slides open via redirect link.
- Oversized/unsupported files show a deterministic fallback with Download/Open-in-Google.
- Tests and QA scenarios pass.
