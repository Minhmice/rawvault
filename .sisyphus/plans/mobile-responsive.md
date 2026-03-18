# RawVault Mobile-First Responsive Redesign

## TL;DR

> **Quick Summary**: Centralize 12 scattered per-component theme style maps into a unified CSS token system, then build a full mobile-responsive layout with bottom tab navigation, slide-out mobile sheet, long-press action sheets, and bottom sheet dialogs — all working across 4 themes (vivid, monochrome, bauhaus, linear). Set up vitest + Playwright test infrastructure FIRST as a safety net before any refactoring.
> 
> **Deliverables**:
> - Unified theme token system replacing 10 hardcoded `Record<ThemeName, string>` maps
> - Mobile bottom tab bar for primary navigation
> - Mobile slide-out sheet for sidebar content (accounts, user profile)
> - Long-press action sheet for file/folder touch interactions
> - Bottom sheet wrappers for all dialogs on mobile
> - ThemePanel as bottom sheet on mobile
> - Responsive auth pages (login/signup polish)
> - vitest + Playwright test infrastructure with visual regression baselines
> 
> **Estimated Effort**: XL
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: Test setup → Theme centralization → Mobile components → Responsive integration → Final QA

---

## Context

### Original Request
User wants to make their desktop-only RawVault app (Next.js cloud drive for RAW photographers) responsive for mobile. Core pain point: the app has 4 themes and 12+ scattered theme style maps across components, making mobile adaptation a multiplicative N×M problem.

### Interview Summary
**Key Discussions**:
- Theme architecture creates scaling problem: 12 theme maps × 4 themes = 48+ style definitions scattered across 6 files
- User wants to centralize themes BEFORE adding mobile responsiveness
- Bottom tab bar for mobile navigation (My Vault, Shared, Recent, Starred)
- Long-press action sheet to replace right-click ContextMenu on files/folders
- Bottom sheet style dialogs on mobile
- ThemePanel as bottom sheet on mobile
- Full mobile-first redesign with production-ready quality
- Set up vitest + Playwright from scratch

**Research Findings**:
- 12 distinct theme maps found across Sidebar.tsx (3), Topbar.tsx (2), FileGrid.tsx (2), SharedClient.tsx (1), share page (2), ThemePanel.tsx (2)
- 10 are layout styling maps (centralization targets); 2 are configuration data (ACCENT_PALETTES, THEME_CARDS — leave as-is)
- Current responsive state better than initially assumed: file grid already 2-col on mobile, auth pages already centered, topbar has some responsive padding
- Critical gaps: no mobile navigation, no sidebar replacement, no touch interaction alternatives
- Three-layer component system (core/theme/themes) should NOT be restructured — separate concern
- FOLDER_CARD_HOVER contains complex multi-property CSS transitions that can't trivially become CSS variables
- Linear theme has performance-heavy pseudo-elements (800×800 blur blobs, noise texture) needing mobile consideration

### Metis Review
**Identified Gaps** (addressed):
- Phase ordering wrong — tests must come FIRST before refactoring (fixed: test setup is now Phase 0)
- 12 theme maps, not 7 — SharedClient.tsx and share page had undiscovered maps (included in plan)
- File grid already 2-column on mobile — minimal grid work needed (noted, focus on card density instead)
- Auth pages already mobile-usable — included for polish but scoped as light work
- Complex transition maps (FOLDER_CARD_HOVER) need `data-theme` approach, not CSS variables (architect specifically)
- i18n keys needed for new mobile components (added as explicit sub-tasks)
- Public share page `/s/[token]` has its own theme maps (included in centralization scope)
- Linear theme pseudo-elements need mobile performance consideration (added `@media` simplification)

---

## Work Objectives

### Core Objective
Eliminate the N×M theme scaling problem by centralizing style tokens, then build a production-ready mobile experience with native-feeling navigation, touch interactions, and responsive layouts — all verified across 4 themes via automated visual regression testing.

### Concrete Deliverables
- `lib/theme-tokens.ts` or equivalent centralized theme token module
- Updated `globals.css` with new CSS variables per `.theme-*` block
- `components/mobile/BottomTabBar.tsx` — fixed bottom navigation
- `components/mobile/MobileSheet.tsx` — slide-out drawer for sidebar content
- `components/mobile/ActionSheet.tsx` — long-press triggered bottom action sheet
- `components/mobile/BottomSheet.tsx` — wrapper converting dialogs to bottom sheets on mobile
- `hooks/useIsMobile.ts` — responsive breakpoint hook
- Updated `DashboardLayout.tsx` with mobile/desktop conditional rendering
- Updated all workspace components with responsive breakpoints
- `vitest.config.ts` + `playwright.config.ts` + baseline screenshots
- i18n keys for all new mobile components

### Definition of Done
- [ ] `npm run build` passes with zero errors
- [ ] All 4 themes render correctly on desktop (visual regression against baseline)
- [ ] All 4 themes render correctly on mobile viewport (375×812)
- [ ] Bottom tab bar visible on mobile, hidden on desktop
- [ ] Sidebar hidden on mobile, replaced by MobileSheet
- [ ] Long-press on file/folder card opens ActionSheet on mobile
- [ ] All dialogs render as bottom sheets on mobile viewports
- [ ] ThemePanel opens as bottom sheet on mobile
- [ ] No ContextMenu rendered on touch devices
- [ ] `npx vitest run` passes
- [ ] `npx playwright test` passes

### Must Have
- Theme tokens centralized so adding a 5th theme requires changes in ONE place per concern
- Mobile navigation that doesn't break any of the 4 themes
- Touch-friendly file/folder interactions on mobile
- Visual regression safety net across all 4 themes
- Build passes after every change

### Must NOT Have (Guardrails)
- Do NOT modify `components/themes/index.tsx` or `components/themes/[name]/*.tsx` — the proxy component system is separate from layout theme maps
- Do NOT restructure the three-layer component system (core/Button, theme/Button, themes/[name]/Button)
- Do NOT refactor `VaultClient.tsx` or `SharedClient.tsx` data-fetching logic — only touch JSX/layout
- Do NOT create mobile-specific theme variants (no "vivid-mobile" theme) — responsive handled via CSS, not JS theme switching
- Do NOT add PWA features, service workers, or offline support
- Do NOT add swipe gestures, pinch-to-zoom, or pull-to-refresh — keep touch to long-press only
- Do NOT "optimize" Linear theme ambient blobs or noise texture beyond adding reduced-motion media query
- Do NOT add new features — this is purely responsive adaptation
- Do NOT modify backend/API routes or database schema
- Do NOT create new themes

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (setting up from scratch)
- **Automated tests**: YES (tests-after — vitest for hooks/utilities, Playwright for visual regression + mobile e2e)
- **Framework**: vitest (unit/component) + Playwright (e2e/visual)
- **Visual regression**: Screenshot baseline captured for all 4 themes on desktop + mobile viewports BEFORE any changes

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Theme centralization tasks**: Playwright screenshot comparison — before vs after for each theme
- **Mobile component tasks**: Playwright at mobile viewport (375×812) — interact, assert DOM, screenshot
- **Responsive integration tasks**: Playwright at both desktop (1440×900) and mobile (375×812) viewports
- **Cross-theme verification**: Each visual test runs across `['vivid', 'monochrome', 'bauhaus', 'linear']`

### Theme × Mode Matrix (MUST verify all):
| Theme | Mode | Verify |
|-------|------|--------|
| vivid | light | ✅ |
| vivid | dark | ✅ |
| monochrome | light | ✅ |
| monochrome | dark | ✅ |
| bauhaus | light | ✅ (no dark mode) |
| linear | dark | ✅ (always dark) |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 0 (Start Immediately — test infrastructure, no deps):
├── Task 1: vitest setup + base config [quick]
├── Task 2: Playwright setup + mobile viewport presets [quick]
└── Task 3: useIsMobile hook + breakpoint utilities [quick]

Wave 1 (After Wave 0 — theme centralization, MAX PARALLEL):
├── Task 4: Capture visual regression baselines (depends: 2) [unspecified-high]
├── Task 5: Centralize simple theme maps — TOPBAR_BUTTON, TOPBAR_SEARCH, PREVIEW_TONE (depends: 4) [deep]
├── Task 6: Centralize structured theme maps — NAV_THEME, LOGO_THEME, ACCOUNT_CARD_THEME (depends: 4) [deep]
├── Task 7: Centralize complex transition maps — FOLDER_CARD_HOVER, SHARE_LINK_CARD_THEME (depends: 4) [deep]
├── Task 8: Centralize share page maps + SharedClient map (depends: 4) [quick]
└── Task 9: Add mobile performance @media for Linear theme pseudo-elements (depends: 4) [quick]

Wave 2 (After Wave 1 — mobile components, MAX PARALLEL):
├── Task 10: Build BottomTabBar component (depends: 3, 5) [visual-engineering]
├── Task 11: Build MobileSheet (drawer) component (depends: 3) [visual-engineering]
├── Task 12: Build ActionSheet for long-press interactions (depends: 3) [visual-engineering]
├── Task 13: Build BottomSheet wrapper for dialogs (depends: 3) [visual-engineering]
├── Task 14: Add i18n keys for all new mobile components (depends: none) [quick]
└── Task 15: Add reduced-motion support to theme animations (depends: 5, 6) [quick]

Wave 3 (After Wave 2 — responsive integration, MAX PARALLEL):
├── Task 16: Integrate mobile nav into DashboardLayout (depends: 10, 11) [deep]
├── Task 17: Convert Sidebar content to MobileSheet (depends: 11, 16) [visual-engineering]
├── Task 18: Make Topbar responsive with mobile search (depends: 16) [visual-engineering]
├── Task 19: Adapt FileGrid — ActionSheet for touch + card density (depends: 12) [visual-engineering]
├── Task 20: Convert all dialogs to BottomSheet on mobile (depends: 13) [unspecified-high]
├── Task 21: Make ThemePanel a BottomSheet on mobile (depends: 13) [visual-engineering]
├── Task 22: Polish auth pages for mobile (depends: 3) [quick]
└── Task 23: Polish share page for mobile (depends: 8) [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | — | 0 |
| 2 | — | 4 | 0 |
| 3 | — | 10, 11, 12, 13, 22 | 0 |
| 4 | 2 | 5, 6, 7, 8, 9 | 1 |
| 5 | 4 | 10, 15 | 1 |
| 6 | 4 | 15, 17 | 1 |
| 7 | 4 | 19 | 1 |
| 8 | 4 | 23 | 1 |
| 9 | 4 | — | 1 |
| 10 | 3, 5 | 16 | 2 |
| 11 | 3 | 16, 17 | 2 |
| 12 | 3 | 19 | 2 |
| 13 | 3 | 20, 21 | 2 |
| 14 | — | — | 2 |
| 15 | 5, 6 | — | 2 |
| 16 | 10, 11 | 17, 18 | 3 |
| 17 | 11, 16 | — | 3 |
| 18 | 16 | — | 3 |
| 19 | 12 | — | 3 |
| 20 | 13 | — | 3 |
| 21 | 13 | — | 3 |
| 22 | 3 | — | 3 |
| 23 | 8 | — | 3 |

### Agent Dispatch Summary

- **Wave 0**: **3** — T1 → `quick`, T2 → `quick`, T3 → `quick`
- **Wave 1**: **6** — T4 → `unspecified-high`, T5 → `deep`, T6 → `deep`, T7 → `deep`, T8 → `quick`, T9 → `quick`
- **Wave 2**: **6** — T10-T13 → `visual-engineering`, T14 → `quick`, T15 → `quick`
- **Wave 3**: **8** — T16 → `deep`, T17-T19 → `visual-engineering`, T20 → `unspecified-high`, T21 → `visual-engineering`, T22-T23 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Set up vitest configuration and base test utilities

  **What to do**:
  - Install vitest as dev dependency: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`
  - Create `vitest.config.ts` at project root with: React plugin, jsdom environment, path aliases matching `tsconfig.json` (`@/` → `./`), test file pattern `**/*.test.{ts,tsx}`
  - Create `lib/test-utils.ts` with custom render function that wraps components in `ThemeProvider` + `LocaleProvider` (the app's required context providers)
  - Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `package.json`
  - Create a trivial smoke test `lib/__tests__/smoke.test.ts` to verify the setup works

  **Must NOT do**:
  - Do NOT install Playwright here (Task 2)
  - Do NOT write component tests yet — just the infrastructure

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
    - No specialized skills needed — standard npm + config file creation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 2, 3)
  - **Blocks**: None directly
  - **Blocked By**: None (can start immediately)

  **References**:
  
  **Pattern References**:
  - `tsconfig.json` — Path aliases to replicate in vitest config (check `paths` for `@/*` mapping)
  - `package.json:20-46` — Current dependencies to understand compatibility

  **API/Type References**:
  - `components/theme-provider/ThemeProvider.tsx:88-138` — ThemeProvider component to wrap in test utils
  - `components/i18n/LocaleProvider.tsx` — LocaleProvider component needed in test wrapper

  **External References**:
  - Official docs: https://vitest.dev/config/ — Vitest configuration options
  - Official docs: https://testing-library.com/docs/react-testing-library/setup — Custom render setup

  **Acceptance Criteria**:
  - [ ] `vitest.config.ts` exists at project root
  - [ ] `lib/test-utils.ts` exports `render` function wrapping ThemeProvider + LocaleProvider
  - [ ] `npx vitest run` → PASS (1 test, 0 failures)
  - [ ] `npm run test` script works

  **QA Scenarios**:
  ```
  Scenario: vitest runs successfully
    Tool: Bash
    Preconditions: npm install completed
    Steps:
      1. Run `npx vitest run --reporter=verbose`
      2. Assert exit code 0
      3. Assert output contains "1 passed"
    Expected Result: Exit code 0, output shows "Tests 1 passed"
    Failure Indicators: Non-zero exit code, "FAIL" in output
    Evidence: .sisyphus/evidence/task-1-vitest-smoke.txt

  Scenario: vitest config resolves path aliases
    Tool: Bash
    Preconditions: vitest.config.ts created
    Steps:
      1. Create temp test `lib/__tests__/alias-check.test.ts` that imports `import { cn } from '@/lib/utils'`
      2. Run `npx vitest run lib/__tests__/alias-check.test.ts`
      3. Assert it resolves without "Cannot find module" error
      4. Delete the temp test file
    Expected Result: Import resolves, test passes
    Failure Indicators: "Cannot find module @/lib/utils"
    Evidence: .sisyphus/evidence/task-1-alias-resolve.txt
  ```

  **Commit**: YES
  - Message: `feat(test): add vitest config and base test utilities`
  - Files: `vitest.config.ts`, `lib/test-utils.ts`, `lib/__tests__/smoke.test.ts`, `package.json`
  - Pre-commit: `npm run lint`

- [x] 2. Set up Playwright configuration with mobile viewport presets

  **What to do**:
  - Install Playwright: `npm install -D @playwright/test && npx playwright install chromium`
  - Create `playwright.config.ts` with:
    - `baseURL: 'http://localhost:3000'`
    - Two projects: `desktop` (viewport 1440×900) and `mobile` (viewport 375×812, `isMobile: true`, `hasTouch: true`)
    - `testDir: 'e2e'`, `outputDir: 'e2e/results'`
    - `webServer` config to start `npm run dev` if not already running
  - Create `e2e/` directory
  - Create a trivial smoke test `e2e/smoke.spec.ts` that loads the app root

  **Must NOT do**:
  - Do NOT capture visual baselines here (Task 4)
  - Do NOT write mobile interaction tests yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 1, 3)
  - **Blocks**: Task 4 (needs Playwright to capture baselines)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `package.json:6` — `"dev": "next dev"` — the dev server command for webServer config

  **External References**:
  - Official docs: https://playwright.dev/docs/test-configuration — Playwright config
  - Official docs: https://playwright.dev/docs/emulation#devices — Mobile device emulation

  **Acceptance Criteria**:
  - [ ] `playwright.config.ts` exists with desktop + mobile projects
  - [ ] `e2e/` directory exists
  - [ ] `npx playwright test e2e/smoke.spec.ts --project=desktop` passes (or skips if dev server not running)

  **QA Scenarios**:
  ```
  Scenario: Playwright config validates
    Tool: Bash
    Preconditions: Playwright installed
    Steps:
      1. Run `npx playwright test --list` to list all tests
      2. Assert output shows at least 1 test listed
      3. Assert output shows both "desktop" and "mobile" projects
    Expected Result: Test list shows smoke test under both projects
    Failure Indicators: "No tests found" or missing project name
    Evidence: .sisyphus/evidence/task-2-playwright-list.txt

  Scenario: Mobile viewport is configured correctly
    Tool: Bash
    Preconditions: playwright.config.ts created
    Steps:
      1. Run `node -e "const c = require('./playwright.config.ts'); console.log(JSON.stringify(c.default?.projects))"`
      2. If that fails due to TS, grep playwright.config.ts for "width: 375" and "height: 812"
      3. Assert mobile project has isMobile: true and hasTouch: true
    Expected Result: Mobile project configured with 375×812 viewport, touch enabled
    Failure Indicators: Missing mobile project or wrong dimensions
    Evidence: .sisyphus/evidence/task-2-mobile-viewport.txt
  ```

  **Commit**: YES
  - Message: `feat(test): add Playwright config with mobile viewport presets`
  - Files: `playwright.config.ts`, `e2e/smoke.spec.ts`
  - Pre-commit: `npm run lint`

- [x] 3. Create useIsMobile hook and breakpoint utilities

  **What to do**:
  - Create `hooks/useIsMobile.ts` exporting:
    - `useIsMobile()` — returns boolean, true when viewport < 768px (matching existing `max-md:hidden` breakpoint)
    - `useBreakpoint()` — returns `'mobile' | 'tablet' | 'desktop'` (< 768, 768-1024, > 1024)
    - Uses `window.matchMedia` with SSR-safe check (return `false` during SSR)
    - Listens for resize via `matchMedia.addEventListener('change')`
  - Create `hooks/useLongPress.ts` exporting:
    - `useLongPress(callback, options?)` — returns event handlers `{ onPointerDown, onPointerUp, onPointerCancel }`
    - Default delay: 500ms
    - Cancels on pointer move beyond 10px threshold (prevents scroll-triggered long-press)
    - Options: `{ delay?: number, threshold?: number }`
  - Write unit tests for both hooks in `hooks/__tests__/`

  **Must NOT do**:
  - Do NOT build any UI components — just the hooks
  - Do NOT use `window.innerWidth` — use `matchMedia` for performance

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 0 (with Tasks 1, 2)
  - **Blocks**: Tasks 10, 11, 12, 13, 22
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `components/workspace/Sidebar.tsx:162` — `max-md:hidden` — the existing 768px breakpoint to match
  - `components/workspace/Topbar.tsx:84` — `hidden md:flex` — another 768px breakpoint reference

  **External References**:
  - MDN: https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia — matchMedia API

  **Acceptance Criteria**:
  - [ ] `hooks/useIsMobile.ts` exports `useIsMobile` and `useBreakpoint`
  - [ ] `hooks/useLongPress.ts` exports `useLongPress`
  - [ ] `npx vitest run hooks/` → PASS (all hook tests pass)
  - [ ] SSR-safe: hooks return default values when `window` is undefined

  **QA Scenarios**:
  ```
  Scenario: useIsMobile hook tests pass
    Tool: Bash
    Preconditions: vitest configured (Task 1)
    Steps:
      1. Run `npx vitest run hooks/__tests__/useIsMobile.test.ts --reporter=verbose`
      2. Assert tests cover: SSR returns false, mobile viewport returns true, desktop returns false, resize triggers update
    Expected Result: All tests pass
    Failure Indicators: Any test failure or "Cannot find module" errors
    Evidence: .sisyphus/evidence/task-3-use-is-mobile.txt

  Scenario: useLongPress hook tests pass
    Tool: Bash
    Preconditions: vitest configured (Task 1)
    Steps:
      1. Run `npx vitest run hooks/__tests__/useLongPress.test.ts --reporter=verbose`
      2. Assert tests cover: fires callback after 500ms, cancels on pointer move > 10px, cancels on pointer up before delay
    Expected Result: All tests pass
    Failure Indicators: Timeout or callback assertion failures
    Evidence: .sisyphus/evidence/task-3-use-long-press.txt
  ```

  **Commit**: YES
  - Message: `feat(mobile): add useIsMobile and useLongPress hooks`
  - Files: `hooks/useIsMobile.ts`, `hooks/useLongPress.ts`, `hooks/__tests__/*.test.ts`
  - Pre-commit: `npx vitest run hooks/`

- [x] 4. Capture visual regression baseline screenshots for all 4 themes

  **What to do**:
  - Create `e2e/visual-regression.spec.ts` that:
    - Starts dev server (handled by Playwright config webServer)
    - Logs in with QA credentials (use env vars `RAWVAULT_QA_EMAIL` / `RAWVAULT_QA_PASSWORD`)
    - For each theme in `['vivid', 'monochrome', 'bauhaus', 'linear']`:
      - Sets theme via `page.evaluate(() => { localStorage.setItem('rv-theme', JSON.stringify({...preset})); location.reload(); })`
      - Captures full-page screenshot at desktop (1440×900): `{theme}-desktop-vault.png`
      - Captures full-page screenshot at mobile (375×812): `{theme}-mobile-vault.png`
    - Stores baselines in `e2e/screenshots/baseline/`
  - These baselines are the "before" state — every subsequent theme change must visually match

  **Must NOT do**:
  - Do NOT modify any source files — this is read-only screenshot capture
  - Do NOT compare screenshots yet — just establish baselines

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`playwright`]
    - `playwright`: Needed for browser automation and screenshot capture

  **Parallelization**:
  - **Can Run In Parallel**: NO — must complete before Tasks 5-9 start
  - **Parallel Group**: Wave 1 (runs first, then 5-9 in parallel)
  - **Blocks**: Tasks 5, 6, 7, 8, 9
  - **Blocked By**: Task 2 (needs Playwright config)

  **References**:

  **Pattern References**:
  - `components/theme-provider/ThemeProvider.tsx:24-61` — THEME_PRESETS object with all 4 theme configs to use for localStorage injection
  - `app/page.tsx:1-10` — Entry point that renders VaultClient

  **External References**:
  - Playwright docs: https://playwright.dev/docs/screenshots — Screenshot API

  **Acceptance Criteria**:
  - [ ] `e2e/screenshots/baseline/` contains 8 screenshot files (4 themes × 2 viewports)
  - [ ] Each screenshot is non-empty (> 10KB)
  - [ ] Screenshots are committed to repo as baseline reference

  **QA Scenarios**:
  ```
  Scenario: All baseline screenshots captured
    Tool: Bash
    Preconditions: Dev server running, Playwright installed, QA seed data exists
    Steps:
      1. Run `npx playwright test e2e/visual-regression.spec.ts`
      2. List files in `e2e/screenshots/baseline/`
      3. Assert 8 files exist matching pattern `{theme}-{viewport}-vault.png`
      4. Assert each file is > 10KB (not blank/error pages)
    Expected Result: 8 screenshot files, all > 10KB
    Failure Indicators: Missing files, tiny file sizes (blank page), auth errors
    Evidence: .sisyphus/evidence/task-4-baselines.txt

  Scenario: Screenshots show actual app content (not error pages)
    Tool: Playwright
    Preconditions: Baselines captured
    Steps:
      1. Open each baseline screenshot
      2. Use Playwright's visual comparison: verify each contains recognizable UI (sidebar, topbar, file grid)
      3. Verify vivid screenshot shows blue primary color
      4. Verify bauhaus screenshot shows yellow/black styling
    Expected Result: All screenshots contain visible app UI
    Failure Indicators: White screens, error messages, missing UI elements
    Evidence: .sisyphus/evidence/task-4-baseline-verification.png
  ```

  **Commit**: YES
  - Message: `test(visual): capture baseline theme screenshots for regression`
  - Files: `e2e/visual-regression.spec.ts`, `e2e/screenshots/baseline/*.png`
  - Pre-commit: `npx playwright test e2e/visual-regression.spec.ts`

- [x] 5. Centralize simple theme maps — TOPBAR_BUTTON, TOPBAR_SEARCH, PREVIEW_TONE

  **What to do**:
  - These are the simplest maps — each theme variant is a single CSS class string or simple color mapping
  - **TOPBAR_BUTTON** (Topbar.tsx:19-24): 4 themes × 1 string → Move to CSS variables in `globals.css` under each `.theme-*` block. Create variables like `--rv-topbar-btn-radius`, `--rv-topbar-btn-hover-bg`, `--rv-topbar-btn-border`, `--rv-topbar-btn-transition`
  - **TOPBAR_SEARCH** (Topbar.tsx:26-31): Same approach — `--rv-topbar-search-radius`, `--rv-topbar-search-border`, `--rv-topbar-search-focus-ring`, `--rv-topbar-search-focus-border`
  - **PREVIEW_TONE** (FileGrid.tsx:109-114): Map preview status colors to CSS variables — `--rv-preview-ready`, `--rv-preview-failed`, `--rv-preview-pending`, `--rv-preview-processing`
  - Replace the `Record<ThemeName, ...>` objects in Topbar.tsx and FileGrid.tsx with references to CSS variables
  - Delete the old map constants from the source files
  - Run visual regression: screenshot all 4 themes, compare with baselines — must be pixel-identical

  **Must NOT do**:
  - Do NOT modify `components/themes/index.tsx` or `components/themes/[name]/*.tsx`
  - Do NOT change any component behavior — only move styling from JS to CSS
  - Do NOT touch NAV_THEME, LOGO_THEME, or ACCOUNT_CARD_THEME (Task 6)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
    - Requires careful CSS variable mapping and visual verification across 4 themes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 6, 7, 8, 9 — after Task 4 completes)
  - **Blocks**: Tasks 10, 15
  - **Blocked By**: Task 4 (needs baselines to compare against)

  **References**:

  **Pattern References**:
  - `components/workspace/Topbar.tsx:19-31` — TOPBAR_BUTTON and TOPBAR_SEARCH maps to replace
  - `components/workspace/FileGrid.tsx:109-114` — PREVIEW_TONE map to replace
  - `app/globals.css` — Existing `.theme-vivid`, `.theme-monochrome`, `.theme-bauhaus`, `.theme-linear` blocks where new vars go

  **API/Type References**:
  - `components/theme-provider/ThemeProvider.tsx:5` — `ThemeName` type definition

  **WHY Each Reference Matters**:
  - `Topbar.tsx:19-31`: Source maps to delete after moving to CSS vars
  - `FileGrid.tsx:109-114`: Source PREVIEW_TONE to delete
  - `globals.css`: Destination — add new variables inside each `.theme-*` block following existing `--rv-*` naming convention

  **Acceptance Criteria**:
  - [ ] TOPBAR_BUTTON constant removed from Topbar.tsx
  - [ ] TOPBAR_SEARCH constant removed from Topbar.tsx
  - [ ] PREVIEW_TONE constant removed from FileGrid.tsx
  - [ ] New CSS variables defined in globals.css under each `.theme-*` block
  - [ ] `npm run build` passes
  - [ ] Visual regression: screenshots of all 4 themes match baselines

  **QA Scenarios**:
  ```
  Scenario: Topbar buttons render correctly in all 4 themes
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to / and log in
      2. For each theme in [vivid, monochrome, bauhaus, linear]:
        a. Set theme via localStorage
        b. Reload page
        c. Screenshot topbar area (header element)
        d. Compare with baseline topbar screenshot
      3. Assert all 4 comparisons are within 1% pixel difference
    Expected Result: Topbar visually identical to baseline for all themes
    Failure Indicators: Visible color/radius/transition differences
    Evidence: .sisyphus/evidence/task-5-topbar-{theme}.png

  Scenario: Build passes after removing map constants
    Tool: Bash
    Preconditions: Maps replaced with CSS variables
    Steps:
      1. Run `npm run build`
      2. Assert exit code 0
      3. Grep Topbar.tsx for "TOPBAR_BUTTON" — should not exist
      4. Grep FileGrid.tsx for "PREVIEW_TONE" — should not exist
    Expected Result: Build passes, old constants removed
    Failure Indicators: Build error, TypeScript error referencing old constants
    Evidence: .sisyphus/evidence/task-5-build-pass.txt
  ```

  **Commit**: YES
  - Message: `refactor(theme): centralize TOPBAR_BUTTON, TOPBAR_SEARCH, PREVIEW_TONE into CSS variables`
  - Files: `app/globals.css`, `components/workspace/Topbar.tsx`, `components/workspace/FileGrid.tsx`
  - Pre-commit: `npm run build`

- [x] 6. Centralize structured theme maps — NAV_THEME, LOGO_THEME, ACCOUNT_CARD_THEME

  **What to do**:
  - These are complex maps with nested objects (base/active/inactive, wrapper/inner/text, card/badge)
  - **NAV_THEME** (Sidebar.tsx:48-69): Each theme has `{ base, active, inactive }`. Create CSS variables:
    - `--rv-nav-radius`, `--rv-nav-font-weight`, `--rv-nav-tracking`, `--rv-nav-transition`
    - `--rv-nav-active-bg`, `--rv-nav-active-text`, `--rv-nav-active-shadow`
    - `--rv-nav-inactive-text`, `--rv-nav-inactive-hover-bg`, `--rv-nav-inactive-hover-text`
    - Note: bauhaus has `border-l-4` → needs `--rv-nav-border-style` variable
  - **LOGO_THEME** (Sidebar.tsx:71-92): Each theme has `{ wrapper, inner, text }`. Create variables for wrapper bg, border style, text gradient vs solid
  - **ACCOUNT_CARD_THEME** (Sidebar.tsx:94-111): Each theme has `{ card, badge }`. Create variables for card border, hover effect, badge styling
  - Replace maps in Sidebar.tsx with CSS variable references
  - The tricky part: some themes use Tailwind utility classes that aren't easily expressed as CSS variables (e.g., `hover:translate-x-1`). For these, use `data-theme` attribute selectors in globals.css
  - Run visual regression after changes

  **Must NOT do**:
  - Do NOT modify `components/themes/index.tsx` or theme proxy system
  - Do NOT change Sidebar functionality or layout structure
  - Do NOT touch FOLDER_CARD_HOVER (Task 7)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
    - Complex CSS architecture — needs careful mapping of nested objects to flat CSS variables

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 5, 7, 8, 9)
  - **Blocks**: Tasks 15, 17
  - **Blocked By**: Task 4 (needs baselines)

  **References**:

  **Pattern References**:
  - `components/workspace/Sidebar.tsx:48-111` — NAV_THEME, LOGO_THEME, ACCOUNT_CARD_THEME definitions
  - `components/workspace/Sidebar.tsx:149-152` — How maps are consumed: `const nav = NAV_THEME[name]`
  - `app/globals.css` — Existing `.theme-*` blocks to add variables to

  **WHY Each Reference Matters**:
  - `Sidebar.tsx:48-111`: The 3 maps to centralize — study each theme's unique properties
  - `Sidebar.tsx:149-152`: How the maps are consumed — must replicate access pattern with CSS vars
  - `globals.css`: Destination for new variables

  **Acceptance Criteria**:
  - [ ] NAV_THEME, LOGO_THEME, ACCOUNT_CARD_THEME removed from Sidebar.tsx
  - [ ] CSS variables for all 3 maps defined in globals.css
  - [ ] Sidebar renders identically in all 4 themes (visual regression passes)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Sidebar renders identically after centralization
    Tool: Playwright
    Preconditions: Dev server running, baselines captured
    Steps:
      1. Navigate to / and log in
      2. For each theme [vivid, monochrome, bauhaus, linear]:
        a. Set theme, reload
        b. Screenshot sidebar element (aside[class*="w-64"])
        c. Compare with baseline sidebar screenshot
      3. All comparisons within 1% pixel difference
    Expected Result: Sidebar identical to baseline for all 4 themes
    Failure Indicators: Color changes, spacing changes, border differences
    Evidence: .sisyphus/evidence/task-6-sidebar-{theme}.png

  Scenario: Navigation active/inactive states work correctly
    Tool: Playwright
    Preconditions: Dev server, logged in
    Steps:
      1. Set theme to "vivid"
      2. Click "My Vault" nav item
      3. Assert it has active styling (check computed background-color)
      4. Assert other nav items have inactive styling
      5. Repeat for "bauhaus" theme (which uses border-l-4 for active)
    Expected Result: Active/inactive states correctly applied via CSS variables
    Failure Indicators: Wrong colors, missing borders, broken transitions
    Evidence: .sisyphus/evidence/task-6-nav-states.png
  ```

  **Commit**: YES
  - Message: `refactor(theme): centralize NAV_THEME, LOGO_THEME, ACCOUNT_CARD_THEME into CSS variables`
  - Files: `app/globals.css`, `components/workspace/Sidebar.tsx`
  - Pre-commit: `npm run build`

- [x] 7. Centralize complex transition maps — FOLDER_CARD_HOVER, SHARE_LINK_CARD_THEME

  **What to do**:
  - These maps contain complex multi-property CSS transition strings with cubic-bezier curves, shadow stacks, and transforms. They CANNOT trivially become simple CSS variables.
  - **Strategy**: Use `data-theme` attribute selectors in globals.css instead of CSS custom properties
  - Add `data-theme={theme.name}` attribute to the root elements consuming these maps (the ThemeCard wrappers in FileGrid.tsx and SharedClient.tsx)
  - In `globals.css`, create `[data-theme="vivid"] .card-hover { ... }`, `[data-theme="monochrome"] .card-hover { ... }`, etc.
  - Move the transition/transform/shadow strings into these CSS rules
  - **FOLDER_CARD_HOVER** (FileGrid.tsx:45-54): Complex `hover:-translate-y-1 hover:shadow-lg [transition:...]` strings
  - **SHARE_LINK_CARD_THEME** (SharedClient.tsx): Similar hover effect class
  - Replace inline class concatenation with the CSS class approach
  - Run visual regression after changes

  **Must NOT do**:
  - Do NOT attempt to put complex transition shorthand into CSS custom properties (browser support issues)
  - Do NOT modify the ThemeCard component itself
  - Do NOT modify `components/themes/index.tsx`

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
    - Most complex CSS architecture task — needs deep understanding of CSS transitions + data-attribute selectors

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 5, 6, 8, 9)
  - **Blocks**: Task 19
  - **Blocked By**: Task 4 (needs baselines)

  **References**:

  **Pattern References**:
  - `components/workspace/FileGrid.tsx:45-54` — FOLDER_CARD_HOVER with cubic-bezier transitions and shadow stacks
  - `components/workspace/SharedClient.tsx:102` — SHARE_LINK_CARD_THEME (search for this constant)
  - `app/globals.css` — Where to add `[data-theme="..."]` selectors

  **WHY Each Reference Matters**:
  - `FileGrid.tsx:45-54`: Study the exact transition strings — note `[transition:...]` Tailwind arbitrary syntax
  - `SharedClient.tsx:102`: The share page's card hover — same pattern
  - Note: bauhaus uses `active:translate-y-[2px]` (click effect) — must preserve

  **Acceptance Criteria**:
  - [ ] FOLDER_CARD_HOVER removed from FileGrid.tsx
  - [ ] SHARE_LINK_CARD_THEME removed from SharedClient.tsx
  - [ ] `data-theme` attribute applied correctly
  - [ ] Card hover effects work identically in all 4 themes (visual regression)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: File card hover effects work in all themes
    Tool: Playwright
    Preconditions: Dev server running with files/folders visible
    Steps:
      1. For each theme:
        a. Set theme, reload
        b. Hover over a file card
        c. Screenshot during hover state (use page.hover() then immediate screenshot)
        d. Compare hover lift/shadow with baseline behavior
    Expected Result: Hover animations match original per-theme behavior
    Failure Indicators: Missing lift, wrong shadow, broken transitions
    Evidence: .sisyphus/evidence/task-7-hover-{theme}.png

  Scenario: Bauhaus active click effect preserved
    Tool: Playwright
    Preconditions: Theme set to "bauhaus"
    Steps:
      1. Find a file card
      2. Dispatch pointerdown event
      3. Assert card has translate-y-[2px] (active push-down effect)
      4. Release pointer
    Expected Result: Active state pushes card down 2px
    Failure Indicators: No active state, missing shadow removal
    Evidence: .sisyphus/evidence/task-7-bauhaus-active.png
  ```

  **Commit**: YES
  - Message: `refactor(theme): centralize FOLDER_CARD_HOVER and SHARE_LINK_CARD_THEME via data-theme selectors`
  - Files: `app/globals.css`, `components/workspace/FileGrid.tsx`, `components/workspace/SharedClient.tsx`
  - Pre-commit: `npm run build`

- [x] 8. Centralize share page theme maps + SharedClient remaining map

  **What to do**:
  - Centralize the 2 theme maps in the public share page (`app/s/[token]/page.tsx`):
    - **SHARE_VIEW_HEADER_THEME** (~line 22): Theme-specific header styling
    - **SHARE_VIEW_TITLE_CLASS** (~line 29): Theme-specific title classes
  - Move to CSS variables in globals.css under each `.theme-*` block
  - These are simple string maps (like TOPBAR_BUTTON), so CSS variables work directly
  - Also verify SharedClient.tsx has no remaining theme maps after Task 7

  **Must NOT do**:
  - Do NOT modify the share page's data fetching or token validation logic
  - Do NOT change share page functionality

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
    - Simple map migration — same pattern as Task 5

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 5, 6, 7, 9)
  - **Blocks**: Task 23
  - **Blocked By**: Task 4 (needs baselines)

  **References**:

  **Pattern References**:
  - `app/s/[token]/page.tsx:22-35` — SHARE_VIEW_HEADER_THEME and SHARE_VIEW_TITLE_CLASS maps
  - `components/workspace/SharedClient.tsx` — Check for remaining theme maps after Task 7 handles SHARE_LINK_CARD_THEME
  - `app/globals.css` — Destination for CSS variables

  **Acceptance Criteria**:
  - [ ] SHARE_VIEW_HEADER_THEME removed from share page
  - [ ] SHARE_VIEW_TITLE_CLASS removed from share page
  - [ ] CSS variables added to globals.css
  - [ ] Share page renders correctly in all themes
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Share page renders correctly after centralization
    Tool: Playwright
    Preconditions: Dev server, valid share token exists (or test page loads)
    Steps:
      1. Navigate to a share page URL
      2. For each theme [vivid, monochrome, bauhaus, linear]:
        a. Set theme, reload
        b. Screenshot the page header area
        c. Verify header and title have correct theme-specific styling
    Expected Result: Share page header matches theme styling
    Failure Indicators: Missing colors, wrong fonts, broken layout
    Evidence: .sisyphus/evidence/task-8-share-{theme}.png
  ```

  **Commit**: YES
  - Message: `refactor(theme): centralize share page and SharedClient theme maps`
  - Files: `app/globals.css`, `app/s/[token]/page.tsx`, `components/workspace/SharedClient.tsx`
  - Pre-commit: `npm run build`

- [x] 9. Add mobile performance @media for Linear theme pseudo-elements

  **What to do**:
  - The Linear theme creates performance-heavy pseudo-elements:
    - `.theme-linear::before` — 800×800px animated blur blobs
    - `body.theme-linear::after` — noise texture overlay at z-index 9999
  - Add `@media` queries in globals.css to simplify/disable these on mobile:
    - `@media (max-width: 767px)` — reduce blob size to 400×400, simplify animation, reduce blur
    - `@media (prefers-reduced-motion: reduce)` — disable animations entirely
  - This prevents performance issues on mobile devices

  **Must NOT do**:
  - Do NOT remove the effects on desktop — only simplify on mobile
  - Do NOT change the visual design beyond performance optimization

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 5, 6, 7, 8)
  - **Blocks**: None
  - **Blocked By**: Task 4 (needs baselines)

  **References**:

  **Pattern References**:
  - `app/globals.css` — Search for `.theme-linear::before` and `body.theme-linear::after` blocks

  **Acceptance Criteria**:
  - [ ] `@media (max-width: 767px)` block reduces Linear pseudo-element size
  - [ ] `@media (prefers-reduced-motion: reduce)` disables animations
  - [ ] Linear theme still looks correct on desktop
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Linear theme loads without performance issues on mobile
    Tool: Playwright
    Preconditions: Dev server, Linear theme active
    Steps:
      1. Set viewport to 375×812 (mobile)
      2. Set theme to "linear"
      3. Navigate to /
      4. Wait 3 seconds for animations to run
      5. Capture performance metrics via `page.metrics()` or `performance.now()` delta
      6. Assert page is responsive (interactions don't lag)
    Expected Result: Page loads and responds within 2 seconds
    Failure Indicators: Jank, long paint times, unresponsive UI
    Evidence: .sisyphus/evidence/task-9-linear-mobile-perf.txt
  ```

  **Commit**: YES
  - Message: `perf(theme): add mobile @media for Linear theme pseudo-elements`
  - Files: `app/globals.css`
  - Pre-commit: `npm run build`

- [x] 10. Build BottomTabBar component with theme support

  **What to do**:
  - Create `components/mobile/BottomTabBar.tsx`:
    - Fixed position at bottom of screen, full width, z-index above content but below sheets
    - 4 tabs: My Vault (HardDrive icon), Shared (Users icon), Recent (Clock icon), Starred (Star icon)
    - Plus a 5th "More" tab (Menu icon) that triggers MobileSheet for sidebar content
    - Active tab indicator using centralized theme CSS variables (e.g., `--rv-nav-active-bg`, `--rv-nav-active-text`)
    - Hidden on desktop (`md:hidden`)
    - Uses `usePathname()` to determine active tab
    - Uses `useLocale()` for tab labels (reuse existing i18n keys: `sidebar.myVault`, `sidebar.sharedByMe`, `sidebar.recent`, `sidebar.starred`)
    - Renders `<Link>` components for navigation
    - Safe area padding for iPhone notch: `pb-[env(safe-area-inset-bottom)]`
  - Write vitest test for active state logic

  **Must NOT do**:
  - Do NOT implement the MobileSheet trigger here — just emit an event/callback for the "More" tab
  - Do NOT duplicate navigation logic — reuse existing route definitions

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
    - UI component with careful attention to mobile native feel and theme integration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 11, 12, 13, 14, 15)
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 3 (useIsMobile), 5 (centralized nav theme vars)

  **References**:

  **Pattern References**:
  - `components/workspace/Sidebar.tsx:36-46` — `navItemKeys` and `secondaryItemKeys` arrays — reuse the same routes and icon mappings
  - `components/workspace/Sidebar.tsx:188-200` — How active state is determined via `pathname === item.href`
  - `app/globals.css` — Centralized `--rv-nav-*` variables from Task 6

  **API/Type References**:
  - `components/i18n/LocaleProvider.tsx` — `useLocale()` hook for translations

  **Acceptance Criteria**:
  - [ ] `components/mobile/BottomTabBar.tsx` exists
  - [ ] Has `md:hidden` — invisible on desktop
  - [ ] Shows 5 tabs with correct icons and labels
  - [ ] Active tab determined by pathname
  - [ ] Uses centralized theme CSS variables (no hardcoded theme maps)
  - [ ] Safe area padding for iPhone
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: BottomTabBar visible on mobile viewport
    Tool: Playwright
    Preconditions: Component integrated (even temporarily), dev server running
    Steps:
      1. Set viewport to 375×812
      2. Navigate to /
      3. Assert element `[data-testid="bottom-tab-bar"]` is visible
      4. Assert it contains 5 tab items
      5. Assert "My Vault" tab has active styling
      6. Set viewport to 1440×900
      7. Assert `[data-testid="bottom-tab-bar"]` is hidden
    Expected Result: Visible on mobile, hidden on desktop, correct active state
    Failure Indicators: Not visible on mobile, visible on desktop, wrong active tab
    Evidence: .sisyphus/evidence/task-10-bottom-tabs-mobile.png

  Scenario: BottomTabBar themes correctly across all 4 themes
    Tool: Playwright
    Preconditions: Mobile viewport
    Steps:
      1. For each theme [vivid, monochrome, bauhaus, linear]:
        a. Set theme, reload
        b. Screenshot bottom tab bar
        c. Verify active tab uses theme-specific accent color
    Expected Result: Tab bar adapts to each theme's color scheme
    Failure Indicators: Same styling across all themes, missing theme colors
    Evidence: .sisyphus/evidence/task-10-tabs-{theme}.png
  ```

  **Commit**: YES
  - Message: `feat(mobile): add BottomTabBar component with theme support`
  - Files: `components/mobile/BottomTabBar.tsx`, `components/mobile/__tests__/BottomTabBar.test.tsx`
  - Pre-commit: `npm run build`

- [x] 11. Build MobileSheet (drawer) component

  **What to do**:
  - Create `components/mobile/MobileSheet.tsx`:
    - A slide-up/slide-from-left sheet overlay for mobile
    - Props: `open`, `onOpenChange`, `side?: 'bottom' | 'left'`, `snapPoints?: number[]`, `children`
    - Backdrop overlay with click-to-dismiss
    - Drag-to-dismiss gesture (pointer events tracking deltaY, dismiss when dragged > 40% height)
    - Smooth enter/exit animations with CSS transitions
    - Uses theme CSS variables for background, border, shadow
    - `aria-modal="true"`, focus trap, `role="dialog"`
    - Locks body scroll when open (via `overflow: hidden` on body)
  - Build this as a general-purpose primitive — it'll be used by multiple consumers (sidebar, ThemePanel, etc.)
  - Write vitest tests for open/close state management

  **Must NOT do**:
  - Do NOT add sidebar-specific content — this is a generic container
  - Do NOT install any animation library — use CSS transitions + pointer events

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
    - Touch gesture handling + animation + accessibility

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 10, 12, 13, 14, 15)
  - **Blocks**: Tasks 16, 17
  - **Blocked By**: Task 3 (useIsMobile hook)

  **References**:

  **Pattern References**:
  - `components/theme/shadcn/dialog.tsx` — Existing dialog pattern for backdrop + focus trap approach
  - `components/theme/shadcn/scroll-area.tsx` — Existing scroll container pattern

  **External References**:
  - WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ — Modal dialog pattern

  **Acceptance Criteria**:
  - [ ] `components/mobile/MobileSheet.tsx` exists
  - [ ] Opens/closes with smooth animation
  - [ ] Drag-to-dismiss works with pointer events
  - [ ] Backdrop click dismisses
  - [ ] Body scroll locked when open
  - [ ] Accessible (aria-modal, focus trap)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: MobileSheet opens and closes
    Tool: Playwright
    Preconditions: Component rendered with trigger button
    Steps:
      1. Set viewport to 375×812
      2. Click trigger button
      3. Assert `[data-testid="mobile-sheet"]` is visible
      4. Assert backdrop overlay is visible
      5. Click backdrop
      6. Assert sheet is dismissed (not visible)
    Expected Result: Sheet opens on trigger, closes on backdrop click
    Failure Indicators: Sheet doesn't appear, backdrop not clickable, sheet stays open
    Evidence: .sisyphus/evidence/task-11-sheet-open-close.png

  Scenario: Drag-to-dismiss works
    Tool: Playwright
    Preconditions: Sheet is open
    Steps:
      1. Open sheet
      2. Perform drag gesture: pointerdown at sheet handle, move down 300px, pointerup
      3. Assert sheet dismisses with exit animation
    Expected Result: Sheet slides away and closes
    Failure Indicators: Sheet snaps back, no animation, stays open
    Evidence: .sisyphus/evidence/task-11-drag-dismiss.png
  ```

  **Commit**: YES
  - Message: `feat(mobile): add MobileSheet drawer component`
  - Files: `components/mobile/MobileSheet.tsx`, `components/mobile/__tests__/MobileSheet.test.tsx`
  - Pre-commit: `npm run build`

- [ ] 12. Build ActionSheet for long-press interactions

  **What to do**:
  - Create `components/mobile/ActionSheet.tsx`:
    - A bottom sheet specifically for action menus (like iOS action sheets)
    - Props: `open`, `onOpenChange`, `title?`, `actions: Array<{ label, icon?, variant?: 'default' | 'destructive', onSelect }>`
    - Renders a list of action buttons in a bottom sheet
    - Destructive actions styled in red (using `--rv-danger` CSS variable)
    - Separator between regular and destructive actions
    - Cancel button at bottom (always present)
    - Uses MobileSheet (Task 11) internally if available, otherwise standalone
  - Create a `useLongPressActionSheet` hook that combines `useLongPress` (Task 3) with ActionSheet state:
    - Returns `{ actionSheetProps, longPressHandlers }` — bind `longPressHandlers` to a card, `actionSheetProps` to ActionSheet
  - Write vitest tests

  **Must NOT do**:
  - Do NOT integrate with FileGrid yet (Task 19)
  - Do NOT add haptic feedback (not available in web without native bridge)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 10, 11, 13, 14, 15)
  - **Blocks**: Task 19
  - **Blocked By**: Task 3 (useLongPress hook)

  **References**:

  **Pattern References**:
  - `components/workspace/FileGrid.tsx:547-598` — Existing DropdownMenuContent actions (Share, Rename, Download, Delete) — replicate same action list
  - `components/theme/shadcn/dropdown-menu.tsx` — Existing DropdownMenuItem styling to match

  **Acceptance Criteria**:
  - [ ] `components/mobile/ActionSheet.tsx` exists
  - [ ] Renders action list with correct icons and labels
  - [ ] Destructive actions styled with red variant
  - [ ] Cancel button dismisses the sheet
  - [ ] `useLongPressActionSheet` hook combines long-press + sheet state
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: ActionSheet renders with actions
    Tool: Playwright
    Preconditions: ActionSheet rendered with test actions
    Steps:
      1. Set viewport to 375×812
      2. Open ActionSheet
      3. Assert title is visible
      4. Assert all action items are visible with correct labels
      5. Assert destructive action has red text
      6. Assert Cancel button is present
      7. Click Cancel
      8. Assert sheet closes
    Expected Result: Action list renders correctly with theme styling
    Failure Indicators: Missing actions, wrong colors, Cancel doesn't work
    Evidence: .sisyphus/evidence/task-12-action-sheet.png

  Scenario: Long-press triggers ActionSheet
    Tool: Playwright
    Preconditions: Element with longPressHandlers bound
    Steps:
      1. Dispatch pointerdown on element
      2. Wait 600ms (longer than 500ms default)
      3. Dispatch pointerup
      4. Assert ActionSheet is visible
    Expected Result: ActionSheet appears after long-press
    Failure Indicators: Sheet doesn't open, fires on short press
    Evidence: .sisyphus/evidence/task-12-long-press-trigger.png
  ```

  **Commit**: YES
  - Message: `feat(mobile): add ActionSheet for long-press interactions`
  - Files: `components/mobile/ActionSheet.tsx`, `hooks/useLongPressActionSheet.ts`, `components/mobile/__tests__/ActionSheet.test.tsx`
  - Pre-commit: `npm run build`

- [ ] 13. Build BottomSheet wrapper for dialogs

  **What to do**:
  - Create `components/mobile/BottomSheet.tsx`:
    - A wrapper component that renders its children as a bottom sheet on mobile and as a centered dialog on desktop
    - Props: same as shadcn Dialog (`open`, `onOpenChange`, `children`) plus optional `mobileHeight?: string` (default `'70vh'`)
    - Uses `useIsMobile()` to switch rendering mode
    - On mobile: renders as a slide-up bottom sheet (rounded top corners, drag handle, ~60-70% viewport height)
    - On desktop: renders the standard shadcn Dialog unchanged
    - Inherits theme styling from existing Dialog CSS variables
  - This is a transparent wrapper — existing Dialog consumers just swap `<Dialog>` for `<BottomSheet>` and get adaptive behavior

  **Must NOT do**:
  - Do NOT modify the existing shadcn Dialog component
  - Do NOT break existing desktop dialog behavior

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 10, 11, 12, 14, 15)
  - **Blocks**: Tasks 20, 21
  - **Blocked By**: Task 3 (useIsMobile hook)

  **References**:

  **Pattern References**:
  - `components/theme/shadcn/dialog.tsx` — Existing Dialog implementation to wrap/extend
  - `components/workspace/DeleteConfirmDialog.tsx` — Example dialog consumer to test with
  - `components/workspace/RenameDialog.tsx` — Another dialog consumer

  **Acceptance Criteria**:
  - [ ] `components/mobile/BottomSheet.tsx` exists
  - [ ] On desktop viewport: renders as standard centered dialog
  - [ ] On mobile viewport: renders as bottom sheet (slide-up, rounded top)
  - [ ] Drag handle visible on mobile
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: BottomSheet renders as bottom sheet on mobile
    Tool: Playwright
    Preconditions: BottomSheet with test content
    Steps:
      1. Set viewport to 375×812
      2. Open BottomSheet
      3. Get bounding box of sheet content
      4. Assert sheet.y > viewportHeight * 0.25 (starts below 25% from top)
      5. Assert sheet has rounded top corners (border-radius check)
      6. Assert drag handle element is visible
    Expected Result: Sheet positioned at bottom with rounded top corners
    Failure Indicators: Centered like dialog, no drag handle, wrong position
    Evidence: .sisyphus/evidence/task-13-bottom-sheet-mobile.png

  Scenario: BottomSheet renders as dialog on desktop
    Tool: Playwright
    Preconditions: Same BottomSheet component
    Steps:
      1. Set viewport to 1440×900
      2. Open BottomSheet
      3. Get bounding box of sheet content
      4. Assert it's centered (roughly middle of viewport)
      5. Assert no drag handle visible
    Expected Result: Standard centered dialog behavior on desktop
    Failure Indicators: Bottom-positioned, drag handle visible on desktop
    Evidence: .sisyphus/evidence/task-13-bottom-sheet-desktop.png
  ```

  **Commit**: YES
  - Message: `feat(mobile): add BottomSheet adaptive dialog wrapper`
  - Files: `components/mobile/BottomSheet.tsx`, `components/mobile/__tests__/BottomSheet.test.tsx`
  - Pre-commit: `npm run build`

- [x] 14. Add i18n keys for all new mobile components

  **What to do**:
  - Add translation keys for new mobile components in the i18n locale files
  - Keys needed (in both en and vi):
    - `mobile.more` — "More" (for 5th tab in BottomTabBar)
    - `mobile.cancel` — "Cancel" (ActionSheet cancel button)
    - `mobile.accounts` — "Accounts" (MobileSheet header when showing accounts)
    - `mobile.closeSheet` — "Close" (accessibility label for sheet close)
    - `mobile.dragToClose` — "Drag down to close" (accessibility hint)
  - Most tab labels already exist under `sidebar.*` keys — reuse those
  - Follow existing i18n pattern in the project (check `components/i18n/` for structure)

  **Must NOT do**:
  - Do NOT create new i18n infrastructure — use existing pattern
  - Do NOT add unused keys — only what the mobile components actually need

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 10-13, 15)
  - **Blocks**: None
  - **Blocked By**: None (can start anytime)

  **References**:

  **Pattern References**:
  - `components/i18n/LocaleProvider.tsx` — i18n system structure, how keys are organized
  - `lib/i18n/messages.ts` or similar — where translation key/value pairs are defined

  **Acceptance Criteria**:
  - [ ] Translation keys added for en and vi
  - [ ] No missing translation warnings at runtime
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: All mobile i18n keys resolve
    Tool: Bash
    Preconditions: Keys added to locale files
    Steps:
      1. Run `npm run build`
      2. Start dev server
      3. Check browser console for missing translation warnings
    Expected Result: No missing key warnings, build passes
    Failure Indicators: "Missing translation" console warnings
    Evidence: .sisyphus/evidence/task-14-i18n-keys.txt
  ```

  **Commit**: YES
  - Message: `feat(i18n): add mobile component translation keys`
  - Files: i18n locale files
  - Pre-commit: `npm run lint`

- [x] 15. Add prefers-reduced-motion support to theme animations

  **What to do**:
  - Add `@media (prefers-reduced-motion: reduce)` block in globals.css that:
    - Disables all entry animations (`.animate-enter` → `animation: none`)
    - Reduces transition durations to near-instant (`transition-duration: 0.01ms !important`)
    - Disables the Linear theme animated blobs
    - Disables theme-specific hover transforms (translate, scale)
  - This is an accessibility improvement that also helps mobile performance
  - Add the media query AFTER the theme-specific animation blocks in globals.css

  **Must NOT do**:
  - Do NOT remove animations from the default (non-reduced-motion) code path
  - Do NOT change any animation behavior for users who haven't enabled reduced motion

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 10-14)
  - **Blocks**: None
  - **Blocked By**: Tasks 5, 6 (needs centralized CSS variables to reference)

  **References**:

  **Pattern References**:
  - `app/globals.css` — All `.anim-*` blocks and keyframe definitions
  - Search for `@keyframes` in globals.css — all animation definitions to disable

  **External References**:
  - MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

  **Acceptance Criteria**:
  - [ ] `@media (prefers-reduced-motion: reduce)` block exists in globals.css
  - [ ] Animations disabled when reduced-motion is active
  - [ ] Normal animations still work without reduced-motion
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Reduced motion disables animations
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Enable reduced motion: `await page.emulateMedia({ reducedMotion: 'reduce' })`
      2. Navigate to /
      3. Assert no CSS animations are running (check computed animation-name is 'none')
      4. Disable reduced motion: `await page.emulateMedia({ reducedMotion: 'no-preference' })`
      5. Reload and assert animations ARE running
    Expected Result: Animations respect user preference
    Failure Indicators: Animations play during reduced-motion, or always disabled
    Evidence: .sisyphus/evidence/task-15-reduced-motion.txt
  ```

  **Commit**: YES
  - Message: `feat(a11y): add prefers-reduced-motion support for theme animations`
  - Files: `app/globals.css`
  - Pre-commit: `npm run build`

- [ ] 16. Integrate mobile navigation into DashboardLayout

  **What to do**:
  - Modify `components/workspace/DashboardLayout.tsx` to:
    - Import and render `BottomTabBar` (Task 10) below main content on mobile
    - Import and render `MobileSheet` (Task 11) for sidebar content
    - Add state for MobileSheet open/close, triggered by BottomTabBar's "More" tab
    - Keep existing desktop sidebar rendering unchanged (still `max-md:hidden`)
    - Add `pb-[env(safe-area-inset-bottom)]` to main content area on mobile to account for BottomTabBar height
    - Main content area: add bottom padding on mobile so content isn't hidden behind tab bar (`pb-16 md:pb-0`)
  - This is the central integration point — connects BottomTabBar + MobileSheet into the existing layout

  **Must NOT do**:
  - Do NOT modify Sidebar component itself (Task 17)
  - Do NOT change the desktop layout at all — only add mobile additions
  - Do NOT modify VaultClient.tsx data fetching

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
    - Layout integration requiring understanding of the full component tree

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs 10 + 11 complete)
  - **Parallel Group**: Wave 3 (first in wave, then 17, 18 after)
  - **Blocks**: Tasks 17, 18
  - **Blocked By**: Tasks 10 (BottomTabBar), 11 (MobileSheet)

  **References**:

  **Pattern References**:
  - `components/workspace/DashboardLayout.tsx:43-70` — Current layout structure: `flex h-screen` → Sidebar + content column
  - `components/workspace/DashboardLayout.tsx:12-26` — Props type — will need `onOpenMobileSheet` or internal state

  **API/Type References**:
  - `components/mobile/BottomTabBar.tsx` — BottomTabBar props (from Task 10)
  - `components/mobile/MobileSheet.tsx` — MobileSheet props (from Task 11)

  **Acceptance Criteria**:
  - [ ] BottomTabBar visible on mobile viewport
  - [ ] BottomTabBar hidden on desktop viewport
  - [ ] "More" tab opens MobileSheet
  - [ ] Desktop layout completely unchanged
  - [ ] Main content has bottom padding on mobile for tab bar
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Mobile layout shows bottom tabs + no sidebar
    Tool: Playwright
    Preconditions: Dev server, logged in
    Steps:
      1. Set viewport to 375×812
      2. Navigate to /
      3. Assert sidebar (aside.w-64) is NOT visible
      4. Assert BottomTabBar is visible at bottom
      5. Assert main content is visible and scrollable
      6. Click "More" tab
      7. Assert MobileSheet slides in
    Expected Result: Mobile shows tabs at bottom, sidebar replaced by sheet
    Failure Indicators: Sidebar visible on mobile, no bottom tabs, sheet doesn't open
    Evidence: .sisyphus/evidence/task-16-mobile-layout.png

  Scenario: Desktop layout unchanged
    Tool: Playwright
    Preconditions: Dev server, logged in
    Steps:
      1. Set viewport to 1440×900
      2. Navigate to /
      3. Assert sidebar (aside.w-64) IS visible
      4. Assert BottomTabBar is NOT visible
      5. Compare full-page screenshot with baseline
    Expected Result: Desktop layout identical to before
    Failure Indicators: Missing sidebar, bottom tabs visible, layout shift
    Evidence: .sisyphus/evidence/task-16-desktop-unchanged.png
  ```

  **Commit**: YES
  - Message: `feat(responsive): integrate mobile navigation into DashboardLayout`
  - Files: `components/workspace/DashboardLayout.tsx`
  - Pre-commit: `npm run build`

- [ ] 17. Convert Sidebar content to MobileSheet

  **What to do**:
  - Extract sidebar content (user profile, linked accounts, storage quota) into a reusable component or render function that can appear in both:
    - Desktop: inside `<aside>` as currently
    - Mobile: inside `MobileSheet` triggered from DashboardLayout
  - Create `components/workspace/SidebarContent.tsx` (or render props pattern):
    - Contains: user avatar + email, linked accounts list with actions, global storage quota
    - All the logic currently in Sidebar.tsx lines 224-496 (accounts section + session widget)
    - Does NOT contain navigation items (those are in BottomTabBar on mobile)
  - Update `Sidebar.tsx` to use the extracted content component
  - Update `DashboardLayout.tsx` to render `SidebarContent` inside MobileSheet

  **Must NOT do**:
  - Do NOT break desktop sidebar rendering
  - Do NOT move navigation items to SidebarContent (they stay in Sidebar for desktop, BottomTabBar for mobile)
  - Do NOT change account management logic

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Task 16)
  - **Parallel Group**: Wave 3 (after Task 16)
  - **Blocks**: None
  - **Blocked By**: Tasks 11 (MobileSheet), 16 (layout integration)

  **References**:

  **Pattern References**:
  - `components/workspace/Sidebar.tsx:224-496` — Content to extract: linked accounts section + session widget + global quota
  - `components/workspace/Sidebar.tsx:113-121` — SidebarProps type — SidebarContent needs most of these props
  - `components/workspace/DashboardLayout.tsx` — Where MobileSheet with SidebarContent renders

  **Acceptance Criteria**:
  - [ ] `SidebarContent` component created (or equivalent extraction)
  - [ ] Desktop sidebar renders exactly as before
  - [ ] MobileSheet shows user profile + accounts on mobile
  - [ ] Account actions work in MobileSheet (set active, unlink, connect)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: MobileSheet shows account content
    Tool: Playwright
    Preconditions: Mobile viewport, logged in, at least 1 linked account
    Steps:
      1. Set viewport to 375×812
      2. Open MobileSheet via "More" tab
      3. Assert user email is visible in sheet
      4. Assert linked account card is visible
      5. Assert storage quota is visible
      6. Click account menu (MoreVertical icon)
      7. Assert dropdown with "Set Active" / "Unlink" appears
    Expected Result: Full account management accessible in mobile sheet
    Failure Indicators: Missing content, broken actions, empty sheet
    Evidence: .sisyphus/evidence/task-17-mobile-sheet-content.png

  Scenario: Desktop sidebar unchanged
    Tool: Playwright
    Preconditions: Desktop viewport, logged in
    Steps:
      1. Set viewport to 1440×900
      2. Assert sidebar shows user profile, accounts, and quota
      3. Compare with baseline screenshot
    Expected Result: Desktop sidebar identical to before extraction
    Failure Indicators: Missing content, layout changes
    Evidence: .sisyphus/evidence/task-17-desktop-sidebar.png
  ```

  **Commit**: YES
  - Message: `feat(responsive): extract SidebarContent and integrate with MobileSheet`
  - Files: `components/workspace/SidebarContent.tsx`, `components/workspace/Sidebar.tsx`, `components/workspace/DashboardLayout.tsx`
  - Pre-commit: `npm run build`

- [ ] 18. Make Topbar responsive with mobile search

  **What to do**:
  - Update `components/workspace/Topbar.tsx`:
    - On mobile: hide breadcrumb (already `hidden md:flex`) ✅
    - On mobile: make search bar full-width (remove `flex-1 max-w-md` constraint)
    - On mobile: collapse action buttons — show only search + theme toggle (hide notification bell and language picker behind overflow menu, or keep only essential)
    - On mobile: reduce topbar height if needed for space efficiency
    - Keep existing desktop behavior unchanged
  - The search bar is critical on mobile — should be prominent and easy to tap
  - Use responsive Tailwind classes: `w-full md:max-w-md`, `flex md:hidden`, etc.

  **Must NOT do**:
  - Do NOT modify search functionality or state management
  - Do NOT change breadcrumb logic — it's already hidden on mobile

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (after Task 16 completes)
  - **Parallel Group**: Wave 3 (with Tasks 17, 19, 20, 21, 22, 23)
  - **Blocks**: None
  - **Blocked By**: Task 16 (layout must be integrated first)

  **References**:

  **Pattern References**:
  - `components/workspace/Topbar.tsx:75-168` — Current topbar layout
  - `components/workspace/Topbar.tsx:83-112` — Breadcrumb section (already `hidden md:flex`)
  - `components/workspace/Topbar.tsx:114-125` — Search section to make responsive

  **Acceptance Criteria**:
  - [ ] Search bar full-width on mobile
  - [ ] Non-essential buttons hidden or collapsed on mobile
  - [ ] Desktop topbar unchanged
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Topbar adapts to mobile viewport
    Tool: Playwright
    Preconditions: Mobile viewport, logged in
    Steps:
      1. Set viewport to 375×812
      2. Assert search bar spans nearly full width
      3. Assert breadcrumb is not visible
      4. Assert theme toggle button is accessible
      5. Assert topbar doesn't overflow horizontally
    Expected Result: Clean mobile topbar with prominent search
    Failure Indicators: Horizontal overflow, truncated search, missing essential buttons
    Evidence: .sisyphus/evidence/task-18-topbar-mobile.png
  ```

  **Commit**: YES
  - Message: `feat(responsive): make Topbar responsive with mobile search`
  - Files: `components/workspace/Topbar.tsx`
  - Pre-commit: `npm run build`

- [ ] 19. Adapt FileGrid — ActionSheet for touch + card density

  **What to do**:
  - Update `components/workspace/FileGrid.tsx`:
    - On mobile (detected via `useIsMobile()`): disable `ContextMenu` — render ContextMenuTrigger as plain div
    - On mobile: add `useLongPressActionSheet` to file/folder cards — long press opens ActionSheet with same actions (Share, Rename, Download, Delete)
    - The existing DropdownMenu (three-dots) already works on touch — keep it as is
    - On mobile: adjust card preview height — reduce `h-36` to `h-28` for better density on small screens
    - On mobile: adjust file metadata density — hide some secondary info (date) to fit better
    - The grid columns are already responsive (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`) — no grid changes needed
  - Use centralized theme hover classes from Task 7 (data-theme selectors)

  **Must NOT do**:
  - Do NOT change the grid column breakpoints — they're already correct
  - Do NOT remove the DropdownMenu — it's the primary explicit action trigger
  - Do NOT modify file/folder data fetching or state management

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 17, 18, 20, 21, 22, 23)
  - **Blocks**: None
  - **Blocked By**: Task 12 (ActionSheet component)

  **References**:

  **Pattern References**:
  - `components/workspace/FileGrid.tsx:246-360` — Folder cards with ContextMenu wrapping
  - `components/workspace/FileGrid.tsx:470-667` — File cards with ContextMenu wrapping
  - `components/workspace/FileGrid.tsx:547-598` — DropdownMenu actions (Share, Rename, Download, Delete) — replicate in ActionSheet
  - `components/mobile/ActionSheet.tsx` — ActionSheet component (from Task 12)
  - `hooks/useLongPressActionSheet.ts` — Hook from Task 12

  **Acceptance Criteria**:
  - [ ] ContextMenu disabled on mobile (no right-click behavior)
  - [ ] Long press on file/folder card opens ActionSheet
  - [ ] ActionSheet shows same actions as DropdownMenu
  - [ ] Card preview height reduced on mobile
  - [ ] DropdownMenu (three-dots) still works on both mobile and desktop
  - [ ] Desktop ContextMenu still works
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Long press opens ActionSheet on mobile
    Tool: Playwright
    Preconditions: Mobile viewport, files visible
    Steps:
      1. Set viewport to 375×812 with hasTouch: true
      2. Navigate to / with files loaded
      3. Long-press (pointerdown 600ms) on a file card
      4. Assert ActionSheet appears with actions: Share, Rename, Download, Delete
      5. Tap "Download" action
      6. Assert ActionSheet closes
    Expected Result: ActionSheet opens with correct actions on long-press
    Failure Indicators: No ActionSheet, wrong actions, doesn't close after selection
    Evidence: .sisyphus/evidence/task-19-long-press-action.png

  Scenario: ContextMenu still works on desktop
    Tool: Playwright
    Preconditions: Desktop viewport, files visible
    Steps:
      1. Set viewport to 1440×900
      2. Right-click on a file card
      3. Assert ContextMenu appears with actions
    Expected Result: Desktop right-click context menu works as before
    Failure Indicators: No context menu, missing actions
    Evidence: .sisyphus/evidence/task-19-desktop-context.png
  ```

  **Commit**: YES
  - Message: `feat(responsive): adapt FileGrid with ActionSheet for touch and mobile card density`
  - Files: `components/workspace/FileGrid.tsx`
  - Pre-commit: `npm run build`

- [ ] 20. Convert all dialogs to BottomSheet on mobile

  **What to do**:
  - Update all dialog components to use `BottomSheet` (Task 13) instead of raw `Dialog`:
    - `components/workspace/ShareDialog.tsx`
    - `components/workspace/RenameDialog.tsx`
    - `components/workspace/DeleteConfirmDialog.tsx`
    - `components/workspace/CreateFolderDialog.tsx`
    - `components/workspace/UploadFileDialog.tsx`
    - `components/workspace/UploadFolderDialog.tsx`
    - `components/workspace/AddFileDialog.tsx`
    - `components/workspace/AddFolderDialog.tsx`
    - `components/auth/LinkAccountDialog.tsx`
  - For each: replace `<Dialog>` import with `BottomSheet`, keep all other props identical
  - Verify each dialog works in both mobile (bottom sheet) and desktop (centered modal)

  **Must NOT do**:
  - Do NOT change dialog content or logic — only swap the wrapper component
  - Do NOT modify form validation or submission logic

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
    - Systematic changes across many files — needs careful, methodical approach

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 17-19, 21-23)
  - **Blocks**: None
  - **Blocked By**: Task 13 (BottomSheet component)

  **References**:

  **Pattern References**:
  - `components/workspace/DeleteConfirmDialog.tsx` — Simplest dialog — good starting point
  - `components/workspace/RenameDialog.tsx` — Dialog with form input
  - `components/workspace/ShareDialog.tsx` — More complex dialog
  - `components/mobile/BottomSheet.tsx` — The wrapper component (Task 13)

  **Acceptance Criteria**:
  - [ ] All 9 dialog components use BottomSheet wrapper
  - [ ] Dialogs render as bottom sheets on mobile viewport
  - [ ] Dialogs render as centered modals on desktop viewport
  - [ ] All form interactions work in both modes
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Delete dialog renders as bottom sheet on mobile
    Tool: Playwright
    Preconditions: Mobile viewport, files visible
    Steps:
      1. Set viewport to 375×812
      2. Trigger delete on a file (via DropdownMenu or ActionSheet)
      3. Assert dialog appears as bottom sheet (positioned at bottom)
      4. Assert "Delete" and "Cancel" buttons are visible and tappable
      5. Tap "Cancel"
      6. Assert sheet dismisses
    Expected Result: Delete confirmation appears as bottom sheet
    Failure Indicators: Centered modal instead of bottom sheet, buttons too small to tap
    Evidence: .sisyphus/evidence/task-20-delete-mobile.png

  Scenario: All dialogs work on desktop unchanged
    Tool: Playwright
    Preconditions: Desktop viewport
    Steps:
      1. Set viewport to 1440×900
      2. Open each dialog type (create folder, rename, delete, share, upload)
      3. Assert each renders as centered modal
      4. Assert form interactions work
    Expected Result: All dialogs look and function identically to before
    Failure Indicators: Bottom sheet on desktop, layout changes
    Evidence: .sisyphus/evidence/task-20-dialogs-desktop.png
  ```

  **Commit**: YES
  - Message: `feat(responsive): convert all dialogs to BottomSheet on mobile`
  - Files: All dialog components (9 files)
  - Pre-commit: `npm run build`

- [ ] 21. Make ThemePanel a BottomSheet on mobile

  **What to do**:
  - Update `components/theme-editor/ThemePanel.tsx`:
    - Currently renders as a fixed right-side panel
    - On mobile: render inside a `MobileSheet` (slide-up from bottom)
    - On desktop: keep current fixed right-side panel behavior
    - Use `useIsMobile()` to switch rendering mode
    - All theme customization controls (preset selection, accent color, border radius, font, animation) must work in both modes
    - The `toggle-theme-panel` custom event (dispatched from Topbar) should work for both modes

  **Must NOT do**:
  - Do NOT change theme customization functionality
  - Do NOT modify ACCENT_PALETTES or THEME_CARDS config maps — these stay as-is

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 17-20, 22, 23)
  - **Blocks**: None
  - **Blocked By**: Task 13 (BottomSheet/MobileSheet component)

  **References**:

  **Pattern References**:
  - `components/theme-editor/ThemePanel.tsx` — Full component to modify
  - `components/workspace/Topbar.tsx:69-71` — Event dispatch: `window.dispatchEvent(new CustomEvent("toggle-theme-panel"))`
  - `components/mobile/MobileSheet.tsx` — MobileSheet for mobile rendering (Task 11)

  **Acceptance Criteria**:
  - [ ] ThemePanel opens as bottom sheet on mobile
  - [ ] ThemePanel opens as right-side panel on desktop
  - [ ] All customization controls work in both modes
  - [ ] `toggle-theme-panel` event works for both modes
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: ThemePanel opens as bottom sheet on mobile
    Tool: Playwright
    Preconditions: Mobile viewport, logged in
    Steps:
      1. Set viewport to 375×812
      2. Click theme toggle button (Palette icon) in topbar
      3. Assert ThemePanel appears as bottom sheet
      4. Assert preset cards are visible and tappable
      5. Tap a different theme preset (e.g., "bauhaus")
      6. Assert theme changes immediately
      7. Drag sheet down to dismiss
    Expected Result: Theme customization works in mobile sheet
    Failure Indicators: Fixed panel overlapping content, controls too small, theme doesn't switch
    Evidence: .sisyphus/evidence/task-21-theme-panel-mobile.png
  ```

  **Commit**: YES
  - Message: `feat(responsive): make ThemePanel a BottomSheet on mobile`
  - Files: `components/theme-editor/ThemePanel.tsx`
  - Pre-commit: `npm run build`

- [ ] 22. Polish auth pages for mobile

  **What to do**:
  - Review and polish `app/(auth)/login/` and `app/(auth)/signup/` pages:
    - Auth pages already use centered card layout with `max-w-md` — mostly mobile-friendly
    - Ensure form inputs are large enough for touch (min height 44px per Apple HIG)
    - Ensure buttons are full-width on mobile
    - Add proper `inputMode` and `autoComplete` attributes for mobile keyboards
    - Test password field visibility toggle if present
    - Ensure error messages are visible and not cut off on small screens
    - Add `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">` if not present (prevents zoom on input focus in iOS)

  **Must NOT do**:
  - Do NOT change auth logic or API calls
  - Do NOT add new auth features

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
    - Light polish work — auth pages are already mostly responsive

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with all other Wave 3 tasks)
  - **Blocks**: None
  - **Blocked By**: Task 3 (useIsMobile for any conditional rendering)

  **References**:

  **Pattern References**:
  - `app/(auth)/login/page.tsx` — Login page to polish
  - `app/(auth)/signup/page.tsx` — Signup page to polish
  - `app/layout.tsx:76` — Check viewport meta tag

  **Acceptance Criteria**:
  - [ ] Form inputs ≥ 44px touch target height
  - [ ] Buttons full-width on mobile
  - [ ] Proper `inputMode` attributes (email for email, text for name)
  - [ ] No horizontal overflow on mobile
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Login page usable on mobile
    Tool: Playwright
    Preconditions: Mobile viewport, not logged in
    Steps:
      1. Set viewport to 375×812
      2. Navigate to /login
      3. Assert email input is visible and tappable (height ≥ 44px)
      4. Assert password input is visible
      5. Assert submit button is full-width
      6. Assert no horizontal scroll
    Expected Result: Login page is touch-friendly and properly sized
    Failure Indicators: Inputs too small, horizontal overflow, button not full-width
    Evidence: .sisyphus/evidence/task-22-login-mobile.png
  ```

  **Commit**: YES
  - Message: `feat(responsive): polish auth pages for mobile`
  - Files: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`
  - Pre-commit: `npm run build`

- [ ] 23. Polish share page for mobile

  **What to do**:
  - Review and polish `app/s/[token]/page.tsx` (public share page):
    - After Task 8 centralized theme maps, ensure the page renders correctly on mobile
    - Adjust layout for small screens: title, file info, download button
    - Download button should be prominent and full-width on mobile
    - File preview area should scale to mobile viewport
    - Test all 4 themes on mobile viewport

  **Must NOT do**:
  - Do NOT change share page authentication/authorization logic
  - Do NOT change file download functionality

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with all other Wave 3 tasks)
  - **Blocks**: None
  - **Blocked By**: Task 8 (share page theme centralization)

  **References**:

  **Pattern References**:
  - `app/s/[token]/page.tsx` — Share page to polish (after Task 8 modifications)

  **Acceptance Criteria**:
  - [ ] Share page renders correctly on mobile (375×812)
  - [ ] Download button prominent and full-width on mobile
  - [ ] All 4 themes work on mobile share page
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Share page renders on mobile
    Tool: Playwright
    Preconditions: Valid share token, mobile viewport
    Steps:
      1. Set viewport to 375×812
      2. Navigate to /s/[test-token]
      3. Assert file name is visible
      4. Assert download button is visible and full-width
      5. Test with all 4 themes
    Expected Result: Share page is usable on mobile
    Failure Indicators: Content overflow, button too small, broken layout
    Evidence: .sisyphus/evidence/task-23-share-mobile.png
  ```

  **Commit**: YES
  - Message: `feat(responsive): polish share page for mobile`
  - Files: `app/s/[token]/page.tsx`
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + `npm run lint` + `npx vitest run` + `npx playwright test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check for AI slop: excessive comments, over-abstraction, generic names. Verify all new components follow existing conventions (useTheme pattern, useLocale for i18n, cn() for className merging).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start dev server. Run Playwright at both desktop (1440×900) and mobile (375×812) viewports. Test EVERY theme (vivid, monochrome, bauhaus, linear). Verify: bottom tabs appear on mobile, sidebar hidden on mobile, MobileSheet opens from tab, long-press opens ActionSheet, dialogs render as bottom sheets, ThemePanel opens as bottom sheet, auth pages look correct. Screenshot evidence for each theme × viewport combination. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Themes [4/4] | Viewports [2/2] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 match. Check "Must NOT do" compliance: `components/themes/index.tsx` unmodified, `components/themes/[name]/*.tsx` unmodified, no data-fetching changes in VaultClient/SharedClient, no new features added, no PWA/service-worker code. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Phase | Commit | Files | Pre-commit |
|-------|--------|-------|------------|
| 0 | `feat(test): add vitest config and base utilities` | vitest.config.ts, lib/test-utils.ts | npm run lint |
| 0 | `feat(test): add Playwright config with mobile presets` | playwright.config.ts, e2e/ | npm run lint |
| 0 | `feat(mobile): add useIsMobile hook` | hooks/useIsMobile.ts | npm run lint |
| 1 | `test(visual): capture baseline theme screenshots` | e2e/visual/ | npx playwright test |
| 1 | `refactor(theme): centralize simple theme maps` | globals.css, Topbar.tsx, FileGrid.tsx | npm run build |
| 1 | `refactor(theme): centralize structured theme maps` | globals.css, Sidebar.tsx | npm run build |
| 1 | `refactor(theme): centralize complex transition maps` | globals.css, FileGrid.tsx | npm run build |
| 1 | `refactor(theme): centralize share + shared theme maps` | globals.css, SharedClient.tsx, share page | npm run build |
| 1 | `perf(theme): add mobile @media for Linear pseudo-elements` | globals.css | npm run build |
| 2 | `feat(mobile): add BottomTabBar component` | components/mobile/BottomTabBar.tsx | npm run build |
| 2 | `feat(mobile): add MobileSheet drawer` | components/mobile/MobileSheet.tsx | npm run build |
| 2 | `feat(mobile): add ActionSheet for long-press` | components/mobile/ActionSheet.tsx | npm run build |
| 2 | `feat(mobile): add BottomSheet dialog wrapper` | components/mobile/BottomSheet.tsx | npm run build |
| 2 | `feat(i18n): add mobile component translation keys` | locales/ | npm run lint |
| 2 | `feat(a11y): add prefers-reduced-motion support` | globals.css | npm run build |
| 3 | `feat(responsive): integrate mobile nav in DashboardLayout` | DashboardLayout.tsx | npm run build |
| 3 | `feat(responsive): convert Sidebar to MobileSheet` | Sidebar.tsx, DashboardLayout.tsx | npm run build |
| 3 | `feat(responsive): make Topbar responsive` | Topbar.tsx | npm run build |
| 3 | `feat(responsive): adapt FileGrid for touch` | FileGrid.tsx | npm run build |
| 3 | `feat(responsive): convert dialogs to BottomSheet` | dialog components | npm run build |
| 3 | `feat(responsive): ThemePanel as BottomSheet on mobile` | ThemePanel.tsx | npm run build |
| 3 | `feat(responsive): polish auth pages` | login/signup pages | npm run build |
| 3 | `feat(responsive): polish share page` | share page | npm run build |

---

## Success Criteria

### Verification Commands
```bash
npm run build            # Expected: Build succeeds
npx vitest run           # Expected: All tests pass
npx playwright test      # Expected: All e2e + visual regression tests pass
npm run lint             # Expected: No errors
```

### Final Checklist
- [ ] All 10 layout theme maps centralized (NAV_THEME, LOGO_THEME, ACCOUNT_CARD_THEME, TOPBAR_BUTTON, TOPBAR_SEARCH, FOLDER_CARD_HOVER, PREVIEW_TONE, SHARE_LINK_CARD_THEME, SHARE_VIEW_HEADER_THEME, SHARE_VIEW_TITLE_CLASS)
- [ ] 2 config maps left untouched (ACCENT_PALETTES, THEME_CARDS)
- [ ] All 4 themes visually identical to baseline on desktop
- [ ] All 4 themes render correctly on mobile (375×812)
- [ ] Bottom tab bar visible on mobile with correct active states
- [ ] MobileSheet accessible from bottom tab bar on mobile
- [ ] ActionSheet triggers on long-press for file/folder cards
- [ ] All 6 dialogs render as bottom sheets on mobile
- [ ] ThemePanel renders as bottom sheet on mobile
- [ ] Auth pages fully mobile-optimized
- [ ] Share page mobile-optimized
- [ ] `components/themes/index.tsx` and `components/themes/[name]/*.tsx` completely UNMODIFIED
- [ ] No data-fetching logic changes in VaultClient.tsx or SharedClient.tsx
- [ ] vitest + Playwright infrastructure working
- [ ] Build passes, lint passes, all tests pass
