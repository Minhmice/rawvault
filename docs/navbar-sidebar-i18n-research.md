# Navbar, Sidebar & i18n — Research & Spec

**Status:** Research deliverable (Phase 1). Implementation follows in Phase 2.

**Sources:** `.cursor/rules/ux-architect.mdc`, `.cursor/rules/ux-researcher.mdc`, `docs/theme-ux-research.md`, `THEME_DEVELOPMENT.md`, handoff plan `navbar-sidebar-i18n-plan.md`.

---

## 1. UX / Information Architecture

### 1.1 Navbar vs Sidebar Roles

| Area | Role | Contents |
|------|------|----------|
| **Topbar (navbar)** | Global workspace chrome | Search, breadcrumb (My Vault / path), theme (Palette), notifications (Bell), **language switcher**. No user identity or sign-out here. |
| **Sidebar (left)** | Navigation + session | Main nav (My Vault, Shared by me, Recent, Starred), Other (Trash, Settings), Linked Accounts, **session widget** (Avatar, email, Total Quota, **Settings + Logout menu**). |

Rationale: Sign-out and account/settings are **session/identity actions**; placing them in the sidebar session widget (bottom-left) keeps the navbar focused on workspace tools (search, theme, language) and avoids cluttering the top bar with user controls. Language is a workspace preference and belongs in the navbar.

### 1.2 Language on Navbar

- **Placement:** Right side of Topbar, after Theme (Palette) and Bell, before any other controls.
- **Options:** EN (English), Tiếng Việt (Vietnamese). Two locales: `en`, `vi`.
- **Behavior:** Switching locale updates UI labels immediately; preference persisted (localStorage/cookie until GET/PATCH workspace preferences exist).

### 1.3 Logout & Settings in Bottom-Left Menu

- **Current:** Session widget has Avatar, email, “Personal”/“USER_SESSION”, and a 3-dot (MoreVertical) with only a tooltip “Account Settings”.
- **Target:** Replace 3-dot with a **DropdownMenu**: first **Settings** (navigates to `/settings` or opens settings surface), then **Logout** (calls `onSignOut` from layout). Order: Settings then Logout (recommended by research: less destructive action first).

### 1.4 User Flow Summary

1. User opens app → sees Topbar (search, breadcrumb, theme, bell, **language**), Sidebar (nav + session widget).
2. Change language → use navbar language switcher → UI re-renders in chosen locale.
3. Account/session actions → open **sidebar session widget menu** (Settings, Logout).
4. Logout → Sidebar menu “Logout” → `onSignOut()` from layout → auth state cleared.

---

## 2. Theme Alignment

### 2.1 Semantic Tokens (theme-ux-research + THEME_DEVELOPMENT)

- **Topbar / Sidebar:** Use existing theme maps (`TOPBAR_BUTTON`, `TOPBAR_SEARCH`, `NAV_THEME`, `LOGO_THEME`, `ACCOUNT_CARD_THEME`) and semantic tokens: `--background`, `--foreground`, `--border`, `--muted`, `--primary`, `--popover`, `--popover-foreground`.
- **Sidebar-specific:** Use `--sidebar`, `--sidebar-foreground`, `--sidebar-border` where defined in `.theme-[name]` in `globals.css`; fallback to `--rv-*` where sidebar tokens are not yet set.
- **Popovers / dropdowns:** DropdownMenu (language switcher in Topbar, Settings/Logout in Sidebar) use shadcn’s `bg-popover`, `text-popover-foreground`, `ring-foreground/10` — i.e. `--popover` and `--popover-foreground` so all themes (vivid, monochrome, bauhaus, linear) style them consistently.

### 2.2 useThemeComponents()

- Topbar and Sidebar already use `useThemeComponents()` for Button, Input, etc. **No change:** continue using theme-aware components for all new buttons (e.g. language trigger, menu items styled as theme buttons where appropriate). Do not import base shadcn or theme-specific components directly in layout composites.

### 2.3 No Breaking of Existing Themes

- Do not add new theme names; do not remove or alter `.theme-vivid`, `.theme-monochrome`, `.theme-bauhaus`, `.theme-linear` animation or token semantics.
- New UI (language switcher, sidebar dropdown): use existing semantic tokens and theme maps only; avoid hardcoded colors that would break monochrome/bauhaus/linear.

---

## 3. Accessibility

### 3.1 Language Switcher (Navbar)

- **Keyboard:** Trigger is focusable (button or combobox); Tab to focus, Enter/Space to open; arrow keys to move between EN / Tiếng Việt if implemented as dropdown; Enter to select; Escape to close.
- **Focus:** Focus moves into the dropdown when opened; focus returns to trigger on close.
- **Labels:** `aria-label` on trigger, e.g. “Choose language (current: English)” or “Chọn ngôn ngữ (hiện tại: Tiếng Việt)”. Use `aria-haspopup="listbox"` or `"menu"` as appropriate; `aria-expanded` toggled with open state.
- **Contrast:** Use `text-foreground` / `text-muted-foreground` and ensure contrast ≥ 4.5:1 for text (theme tokens already respect light/dark).

### 3.2 Sidebar Session Menu (Settings / Logout)

- **Keyboard:** DropdownMenuTrigger focusable; Enter/Space to open; arrow keys between items; Enter to activate; Escape to close.
- **Labels:** Trigger `aria-label="Account menu"` or “Session options”. Menu items have visible text (“Settings”, “Logout”); no need for extra aria-label if text is clear. For icon-only trigger, `aria-label` is required.
- **Focus:** Focus trapped in menu while open; on close, focus returns to trigger.

### 3.3 General

- **Reduced motion:** Respect `prefers-reduced-motion` for any new animations (e.g. dropdown open/close); shadcn/Radix already support this where configured.
- **Color:** Do not rely on color alone for “current language” or “active menu item”; use checkmark, text style, or `aria-current` as appropriate.

---

## 4. Recommendations

### 4.1 Menu Order

- **Sidebar session dropdown:** **Settings** first, **Logout** second. Rationale: Settings is non-destructive and frequently used; Logout last reduces accidental sign-out.

### 4.2 Language Switcher Style

- **Recommendation:** **Dropdown** (not toggle): two options (EN, Tiếng Việt) in a small dropdown from a single trigger (e.g. “EN” or “VI” or globe icon). Dropdown aligns with existing Topbar patterns (theme panel trigger, future menus) and scales if more locales are added. Use `--popover` for the dropdown panel.

### 4.3 Constraints from Theme/UX Docs

- **THEME_DEVELOPMENT.md:** No direct imports from theme folders or base shadcn in `components/workspace/`; use `useThemeComponents()` and theme name for any theme-specific styling.
- **theme-ux-research.md:** Popovers/dropdowns use `--popover`, `--popover-foreground`, `--border`; sidebar uses `--sidebar-*` where available.
- **ux-architect.mdc:** Theme toggle (and by analogy, language) is a global preference and belongs in a consistent, accessible place (navbar).
- **ux-researcher.mdc:** Accessibility and inclusive design are default requirements; aria-labels and keyboard/focus behavior are mandatory for language switcher and session menu.

### 4.4 Locale Persistence

- **Until backend is ready:** Persist locale in **localStorage** (e.g. `rawvault-locale`) with fallback to `navigator.language` (e.g. `vi` → `vi`, else `en`). Optional: sync to a cookie for SSR/hydration if needed.
- **When GET/PATCH `/api/workspace/preferences` exist:** Prefer API for locale (e.g. `preferences.locale`). Frontend should read locale from API on load and PATCH on change; document that the app will switch to API when available.

---

## 5. Implementation Checklist (Phase 2)

- [x] Topbar: Remove Sign out button and UserCircle icon; remove user email from Topbar; add language switcher (EN / Tiếng Việt) on the right; remove `onSignOut` from props; consume i18n via `useLocale()`.
- [x] Sidebar: Replace 3-dot (Tooltip + MoreVertical) in session widget with DropdownMenu (Settings, Logout); Sidebar receives `onSignOut` from layout; Logout calls `onSignOut`.
- [x] DashboardLayout: Pass `onSignOut` to Sidebar only; do not pass to Topbar.
- [x] i18n: Two locales `en`, `vi`; React Context + message maps in `lib/i18n/messages.ts`; language switcher only in navbar; persist locale via localStorage (see §4.4; frontend will switch to GET/PATCH preferences when API exists); message keys for Topbar and Sidebar (My Vault, Settings, Logout, English, Tiếng Việt, etc.).
- [x] Accessibility: aria-label and aria-haspopup for language switcher; aria-label for sidebar account menu trigger; keyboard/focus via shadcn/Base UI; contrast via theme tokens.
- [x] Theme: All new UI uses existing theme maps and `useThemeComponents()`; dropdowns use `--popover` (shadcn); no new themes; no breaking changes to vivid/monochrome/bauhaus/linear.
