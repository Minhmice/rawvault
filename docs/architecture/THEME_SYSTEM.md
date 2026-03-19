# Theme System Architecture

> Canonical specification for the RawVault multi-axis theme system.
> **Stack**: Next.js 16 · Tailwind CSS v4 · shadcn/ui · next-themes

---

## 1. System Overview

The theme system has **five independent axes**. Each axis controls one dimension of visual appearance. They compose orthogonally — any combination must produce a valid UI.

| Axis | Type | Values | Persisted | DOM contract |
|---|---|---|---|---|
| **Preset** | Visual identity | `vivid`, `monochrome`, `bauhaus`, `linear` | `next-themes` (cookie) | `data-theme="{preset}-{mode}"` on `:root` |
| **Mode** | Light/dark | `light`, `dark` | Encoded in preset value | `data-theme` suffix |
| **Surface** | Layout area | `workspace`, `auth`, `marketing`, `admin` | Context only | `data-surface` on boundary `<div>` |
| **Density** | Spacing scale | `comfortable`, `compact` | `localStorage` (`rv-theme-layout`) | `data-density` on `:root` |
| **Radius** | Corner rounding | `default`, `rounded`, `sharp` | `localStorage` (`rv-theme-layout`) | `data-radius` on `:root` |

### How they compose

```
┌─ Preset (vivid) ──────────────────────────────────────────────┐
│  ┌─ Mode (dark) ────────────────────────────────────────────┐ │
│  │  ┌─ Surface (workspace) ──────────────────────────────┐  │ │
│  │  │  ┌─ Density (compact) + Radius (rounded) ───────┐  │  │ │
│  │  │  │                                               │  │  │ │
│  │  │  │     AppButton / AppCard / PageShell           │  │  │ │
│  │  │  │     (wrappers consume all axes)               │  │  │ │
│  │  │  │                                               │  │  │ │
│  │  │  └───────────────────────────────────────────────┘  │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Separation of Concerns

### What each axis controls

| Axis | Controls | Must NOT control |
|---|---|---|
| **Preset** | Color palette, typography (font families), animation personality, shadow style, component variant styling (e.g. Bauhaus box-shadows, Linear spotlight), enter animations | Spacing, padding, max-width, density-related sizing |
| **Mode** | Light/dark token variants (`--rv-bg`, `--rv-surface`, `--rv-text`, shadcn tokens) | Font families, animation behavior, border-radius defaults |
| **Surface** | `max-width`, vertical padding, content area constraints via `PageShell`; layout-zone semantics | Colors, typography, animations |
| **Density** | Component size (`sm` vs default), gap/padding scales, hit-target sizing | Colors, fonts, animation curves |
| **Radius** | Corner radius multiplier applied via `calc(var(--radius) ± offset)` | Colors, fonts, spacing, shadows |

### The golden rule

> **One axis, one concern.** If a change touches two axes, it is a bug.

Examples:
- ✅ Bauhaus preset sets `--rv-radius-lg: 0px` in its CSS → preset controls its own default radius
- ✅ `radiusMode === "rounded"` adds `rounded-[calc(var(--radius)+8px)]` in wrappers → radius axis overrides
- ❌ A preset CSS file setting `padding: 8px` on cards → that's density's job
- ❌ A surface boundary changing font-family → that's preset's job

---

## 3. Source of Truth

### Registry & configuration

| File | Purpose |
|---|---|
| `src/lib/theme/theme-values.ts` | `THEME_NAMES`, `THEME_MODES`, `NextThemeValue` type, `NEXT_THEMES` list — the **canonical enum** of all presets |
| `src/lib/theme/config.ts` | `buildNextThemeValue()`, `parseNextThemeValue()`, `isNextThemeValue()` — encoding/decoding |
| `src/lib/theme/theme-meta.ts` | `THEME_PRESETS` record — label, defaultMode, primaryColor, borderRadius, fontFamily, animation per preset |
| `src/lib/theme/surfaces.ts` | `SURFACE_NAMES`, `SURFACE_IDS`, CSS variable maps (`--rv-surface`, `--rv-surface-muted`, `--rv-surface-hover`) |
| `src/lib/theme/layout-axes.ts` | `Density`, `RadiusMode` types, defaults, parse/validate functions |
| `src/lib/theme/events.ts` | `THEME_PANEL_TOGGLE_EVENT` custom DOM event name |

### CSS token layers

| File | Purpose |
|---|---|
| `src/styles/base.css` | `:root` fallback tokens (light) + `:root[data-theme$="-dark"]` fallback tokens (dark). These are the **baseline** — presets override them. |
| `src/styles/themes/vivid.css` | Vivid preset tokens: `:root[data-theme="vivid-light"]` and `:root[data-theme="vivid-dark"]` |
| `src/styles/themes/monochrome.css` | Monochrome preset tokens (light + dark) |
| `src/styles/themes/bauhaus.css` | Bauhaus preset tokens (light + dark) |
| `src/styles/themes/linear.css` | Linear preset tokens (both selectors share one block — always-dark aesthetic) |
| `src/styles/themes/rawvault.css` | RawVault branded preset (light only, not in `THEME_NAMES` — internal/legacy) |
| `src/app/globals.css` | Tailwind v4 entrypoint — imports all theme CSS, defines `@theme` color aliases, `@custom-variant dark`, animations, component-level theme rules (`.rv-*` classes) |

### Provider & runtime

| File | Purpose |
|---|---|
| `src/components/theme-provider/NextThemesProvider.tsx` | Wraps `next-themes` with `attribute="data-theme"`, disables system preference, registers all `NEXT_THEMES` values |
| `src/components/theme-provider/ThemeProvider.tsx` | Master React context — owns `themeName`, `mode`, `density`, `radiusMode`, `primaryColor`, `borderRadius`. Syncs to DOM (`data-density`, `data-radius`, CSS variables, class toggles). Handles localStorage persistence and legacy migration. |

### Wrapper components (UI contract)

| File | Purpose |
|---|---|
| `src/components/app/AppButton.tsx` | Button wrapper — delegates to `useThemeComponents().ThemeButton`, applies density size + radius override |
| `src/components/app/AppCard.tsx` | Card wrapper — delegates to theme-specific Card, applies density size + radius override |
| `src/components/app/AppInput.tsx` | Input wrapper — delegates to theme-specific Input, applies density sizing + radius override |
| `src/components/app/AppIconButton.tsx` | Icon button — wraps `AppButton` with icon-safe defaults (`type="button"`, `size="icon"`) |
| `src/components/app/AppDialogContent.tsx` | Dialog content — wraps shadcn `DialogContent` with density padding + radius override |
| `src/components/app/AppDialogTitle.tsx` | Dialog title — applies `font-heading font-bold uppercase tracking-widest` |
| `src/components/app/AppDialogActions.tsx` | Dialog footer — flex-end layout for action buttons |
| `src/components/app/AppDialogError.tsx` | Dialog error text — destructive color + `role="alert"` |
| `src/components/app/PageShell.tsx` | Page container — applies surface-aware max-width + padding, density-responsive |
| `src/components/app/PageHeader.tsx` | Page header — title/subtitle/actions layout, surface-aware + density-responsive |
| `src/components/app/SurfaceBoundary.tsx` | Surface context provider — wraps children in `<div data-surface="{name}">`, provides `useSurface()` hook |

### Theme component registry

| File | Purpose |
|---|---|
| `src/components/themes/index.tsx` | `useThemeComponents()` — switches on `themeName`, returns `{ ThemeButton, ThemeCard, ThemeInput }` for active preset |
| `src/components/themes/vivid/Button.tsx` | Vivid personality — scale bloom + brightness lift + shadow glow |
| `src/components/themes/vivid/Card.tsx` | Vivid personality — float up + shadow bloom + spring easing |
| `src/components/themes/vivid/Input.tsx` | (Vivid input variant) |
| `src/components/themes/monochrome/Button.tsx` | Monochrome personality — (mapped via registry) |
| `src/components/themes/monochrome/Card.tsx` | Monochrome personality — foreground/background inversion on hover |
| `src/components/themes/monochrome/Input.tsx` | (Monochrome input variant) |
| `src/components/themes/bauhaus/Button.tsx` | Bauhaus personality — physical press with translate + shadow collapse, mechanical easing |
| `src/components/themes/bauhaus/Card.tsx` | (Bauhaus card variant) |
| `src/components/themes/bauhaus/Input.tsx` | (Bauhaus input variant) |
| `src/components/themes/linear/Button.tsx` | (Linear button variant) |
| `src/components/themes/linear/Card.tsx` | Linear personality — mouse-tracking spotlight, multi-layer shadows, inset highlights |
| `src/components/themes/linear/Input.tsx` | (Linear input variant) |

### Legacy / transitional

| File | Purpose |
|---|---|
| `src/components/theme/Button.tsx` | Older `ThemeButton` (reads `useTheme()` internally, monochrome-specific overrides). Exists alongside per-theme registry — consumed by some legacy paths |
| `src/components/theme/Card.tsx` | Older `ThemeCard` — similar pattern |
| `src/components/theme/Input.tsx` | Older `ThemeInput` — similar pattern |
| `src/components/theme/shadcn/*.tsx` | Unmodified shadcn/ui primitives — **never edit for theme work** |

### Theme editor

| File | Purpose |
|---|---|
| `src/components/theme-editor/ThemePanel.tsx` | Slide-out panel — preset picker, mode toggle, accent color picker, border-radius slider, density/radius mode selectors |

---

## 4. DOM Contract

The theme system communicates to CSS via data attributes on the `<html>` element.

### `data-theme` (on `:root`)

- **Format**: `"{preset}-{mode}"` — e.g. `data-theme="vivid-light"`, `data-theme="bauhaus-dark"`
- **Owner**: `next-themes` library via `NextThemesProvider`
- **Consumers**: All `@layer base` CSS blocks in `src/styles/themes/*.css`
- **Selector pattern**: `:root[data-theme="vivid-light"]` for exact match, `:root[data-theme^="bauhaus-"]` for preset-only match
- **CSS example**:
  ```css
  :root[data-theme="vivid-light"] { --rv-primary: #3b82f6; }
  :root[data-theme^="monochrome-"] .rv-topbar-btn { @apply rounded-none border-2; }
  ```

### `data-surface` (on boundary `<div>`)

- **Format**: `"workspace"` | `"auth"` | `"marketing"` | `"admin"`
- **Owner**: `<SurfaceBoundary surface="...">` component
- **Consumers**: `PageShell`, `PageHeader` (via `useSurface()` context — not CSS selectors)
- **Note**: Currently consumed through React context, not CSS attribute selectors. The `data-surface` attribute is set on the DOM for debugging visibility but layout behavior reads from context.

### `data-density` (on `:root`)

- **Format**: `"comfortable"` | `"compact"`
- **Owner**: `ThemeProvider.tsx` (set via `root.setAttribute("data-density", density)`)
- **Consumers**: Wrapper components via `useTheme().density` in React. Not currently targeted by CSS selectors — density adjustments are applied through wrapper component logic (conditional class names).

### `data-radius` (on `:root`)

- **Format**: `"default"` | `"rounded"` | `"sharp"`
- **Owner**: `ThemeProvider.tsx` (set via `root.setAttribute("data-radius", radiusMode)`)
- **Consumers**: Wrapper components via `useTheme().radiusMode` in React. The radius class computation:
  ```tsx
  // From AppButton, AppCard, AppInput, AppDialogContent:
  radiusMode === "rounded" ? "rounded-[calc(var(--radius)+8px)]"
    : radiusMode === "sharp" ? "rounded-[calc(var(--radius)*0.6)]"
    : "" // "default" — use preset's native --radius
  ```

### Additional DOM side effects (set by `ThemeProvider.tsx`)

| Target | What | Example |
|---|---|---|
| `:root` class | `theme-{preset}` | `theme-vivid` |
| `:root` class | `dark` (compatibility) | Added when `mode === "dark"` |
| `:root` class | `anim-{animation}` | `anim-vivid` (drives `.anim-vivid .animate-enter` rules in globals.css) |
| `:root` style | `--rv-primary`, `--primary`, `--ring` | Dynamic accent color from ThemePanel |
| `:root` style | `--rv-primary-foreground` | Auto-calculated for contrast (luminance check) |
| `:root` style | `--rv-radius-lg/md/sm`, `--radius` | Dynamic border-radius from ThemePanel slider |

---

## 5. Token Contract

Every preset CSS file **must** define the following tokens for **both** `{preset}-light` and `{preset}-dark` selectors (unless the preset is always-dark like Linear, which shares one block).

### RawVault semantic tokens (prefixed `--rv-*`)

| Token | Purpose | Example (vivid-light) |
|---|---|---|
| `--rv-bg` | Page background | `#f8fafc` |
| `--rv-surface` | Card/panel surface | `#ffffff` |
| `--rv-surface-muted` | Muted surface (sidebar, wells) | `#f1f5f9` |
| `--rv-surface-hover` | Surface hover state | `#e2e8f0` |
| `--rv-border` | Default border color | `#e2e8f0` |
| `--rv-text` | Primary text | `#0f172a` |
| `--rv-text-muted` | Secondary text | `#64748b` |
| `--rv-text-subtle` | Tertiary/hint text | `#94a3b8` |
| `--rv-primary` | Brand/accent color | `#3b82f6` |
| `--rv-primary-hover` | Primary hover state | `#2563eb` |
| `--rv-danger` | Error/destructive color | `#ef4444` |
| `--rv-success` | Success color | `#10b981` (from base.css fallback) |
| `--rv-warning` | Warning color | `#f59e0b` (from base.css fallback) |
| `--rv-info` | Info color | `#3b82f6` (from base.css fallback) |
| `--rv-file-image` | File type: image | `#3b82f6` (from base.css fallback) |
| `--rv-file-video` | File type: video | `#a855f7` (from base.css fallback) |
| `--rv-file-doc` | File type: document | `#ef4444` (from base.css fallback) |

> **Fallback behavior**: `src/styles/base.css` provides defaults for all `--rv-*` tokens. Preset CSS files override only what they customize. Tokens not overridden (e.g. `--rv-success`) inherit from base.css.

### Radius tokens

| Token | Purpose | Example (vivid) |
|---|---|---|
| `--rv-radius-lg` | Large radius (cards, dialogs) | `12px` |
| `--rv-radius-md` | Medium radius (buttons, inputs) | `9px` |
| `--rv-radius-sm` | Small radius (badges, chips) | `6px` |
| `--radius` | shadcn base radius (used in `calc()` expressions) | `12px` |

### Typography tokens

| Token | Purpose | Example (vivid) |
|---|---|---|
| `--font-heading` | Heading font stack | `var(--font-outfit, 'Outfit', sans-serif)` |
| `--font-sans` | Body/UI font stack | `var(--font-inter, 'Inter', sans-serif)` |
| `--font-mono` | Code/label font stack | `var(--font-jetbrains-mono, 'JetBrains Mono', monospace)` |

### shadcn/ui tokens (required for component compatibility)

Every preset must define these to ensure shadcn primitives render correctly:

| Token | Purpose |
|---|---|
| `--background`, `--foreground` | Page bg/text |
| `--card`, `--card-foreground` | Card bg/text |
| `--popover`, `--popover-foreground` | Popover/dropdown bg/text |
| `--primary`, `--primary-foreground` | Primary button/accent |
| `--secondary`, `--secondary-foreground` | Secondary variant |
| `--muted`, `--muted-foreground` | Muted surfaces/text |
| `--accent`, `--accent-foreground` | Accent highlight |
| `--destructive`, `--destructive-foreground` | Destructive actions |
| `--border` | Default border |
| `--input` | Input border |
| `--ring` | Focus ring |
| `--chart-1` through `--chart-5` | Chart colors |
| `--sidebar`, `--sidebar-foreground` | Sidebar surface/text |
| `--sidebar-primary`, `--sidebar-primary-foreground` | Sidebar accent |
| `--sidebar-accent`, `--sidebar-accent-foreground` | Sidebar highlight |
| `--sidebar-border`, `--sidebar-ring` | Sidebar borders/focus |

### Tailwind v4 bridge (`globals.css → @theme`)

Tailwind v4 consumes CSS variables via the `@theme` block. The bridge in `globals.css` maps:

```css
@theme {
  --color-rv-bg: var(--rv-bg);
  --color-rv-surface: var(--rv-surface);
  /* ... all --rv-* tokens mapped to --color-rv-* */
  --radius-lg: var(--rv-radius-lg);
  --radius-md: var(--rv-radius-md);
  --radius-sm: var(--rv-radius-sm);
  --font-heading: var(--font-heading);
  --font-sans: var(--font-sans);
}
```

The `@theme inline` block maps shadcn tokens:
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  /* ... all shadcn tokens */
}
```

This allows using `bg-rv-surface`, `text-rv-primary`, `bg-background`, `text-foreground` etc. in Tailwind classes.

### Dark mode variant

```css
@custom-variant dark (&:is([data-theme$="-dark"] *));
```

This wires Tailwind's `dark:` variant to the `data-theme` attribute rather than a `.dark` class or `prefers-color-scheme`.

---

## 6. Wrapper Policy

### Why wrappers exist

Wrappers (`src/components/app/*`) are the **only** layer that knows about all five theme axes simultaneously. They:

1. **Delegate to theme-specific components** — `AppButton` calls `useThemeComponents().ThemeButton` which resolves to `VividButton`, `BauhausButton`, etc.
2. **Apply density** — conditionally change `size` prop (`"sm"` when compact)
3. **Apply radius mode** — add `rounded-[calc(...)]` class overrides
4. **Apply surface context** — `PageShell` reads `useSurface()` to set max-width/padding

### When to use wrappers vs primitives

| Use | Component |
|---|---|
| **Always use wrapper** | `AppButton`, `AppCard`, `AppInput`, `AppIconButton`, `AppDialogContent`, `AppDialogTitle`, `AppDialogActions`, `AppDialogError`, `PageShell`, `PageHeader`, `SurfaceBoundary` |
| **Use shadcn primitive directly** | Only inside wrapper definitions (`src/components/app/*`, `src/components/themes/*/`) or for components without a wrapper (e.g. `Select`, `Table`, `Tabs`) |
| **Never bypass** | Using `<button>` or `<ShadcnButton>` directly in feature code when `AppButton` exists |

### What must never bypass wrappers

- **Feature pages** — must use `PageShell` + `SurfaceBoundary` for layout
- **Any button** in app UI — must use `AppButton` or `AppIconButton`
- **Any card** in app UI — must use `AppCard`
- **Any text input** in app UI — must use `AppInput`
- **Dialogs** — must use `AppDialogContent` / `AppDialogTitle` / `AppDialogActions`

### The component resolution chain

```
Feature Code
  → AppButton (wrapper: density + radius)
    → useThemeComponents().ThemeButton (theme registry: picks preset variant)
      → VividButton / BauhausButton / MonochromeButton / LinearButton
        → ShadcnButton (shadcn primitive: variant system)
          → <button> (DOM)
```

---

## 7. Theme Extension Rules

### Adding a new preset

See full playbook: [`docs/playbooks/ADDING_THEME_PRESET.md`](../playbooks/ADDING_THEME_PRESET.md)

**Summary**: Add to `THEME_NAMES` → add to `THEME_PRESETS` → create CSS file → create theme components → register in `useThemeComponents()` → import CSS in globals.css → update `NEXT_THEMES` → add animations.

### Adding a new surface

1. Add value to `SURFACE_NAMES` in `src/lib/theme/surfaces.ts`
2. Add type guard case in `isSurfaceName()`
3. Add layout rules in `PageShell.tsx` — both comfortable and compact branches
4. Add layout rules in `PageHeader.tsx` if the surface needs header customization
5. **Do not** add color tokens — surfaces control layout, not color

### Extending density

1. Add value to the `Density` type union in `src/lib/theme/layout-axes.ts`
2. Update `isDensity()` and `parseDensity()` validators
3. Add branch in every wrapper that reads `density` — `AppButton`, `AppCard`, `AppInput`, `AppDialogContent`, `PageShell`, `PageHeader`
4. Add selector in `ThemePanel.tsx` density grid
5. **Do not** add CSS tokens — density is applied via wrapper logic, not CSS variables

### Extending radius mode

1. Add value to the `RadiusMode` type union in `src/lib/theme/layout-axes.ts`
2. Update `isRadiusMode()` and `parseRadiusMode()` validators
3. Add branch in every wrapper that reads `radiusMode` — `AppButton`, `AppCard`, `AppInput`, `AppDialogContent`
4. Add selector in `ThemePanel.tsx` radius mode grid
5. Define the `calc(var(--radius) ...)` expression that characterizes the new mode

---

## 8. Guardrails

### Anti-patterns — never do these

| Anti-pattern | Why it's wrong | What to do instead |
|---|---|---|
| Hardcoded colors in feature components (`text-blue-500`, `bg-[#ff0000]`) | Breaks across presets and modes | Use semantic tokens: `text-rv-primary`, `bg-rv-surface`, `text-foreground` |
| Hardcoded `dark:` overrides in feature code | Bypasses the `data-theme`-driven dark mode system | Use tokens that already have dark variants defined in theme CSS |
| Duplicated metadata (label in CSS comment AND a different label in `theme-meta.ts`) | Drift between sources | `THEME_PRESETS` in `theme-meta.ts` is the single source for metadata |
| Mixing axes: preset CSS sets padding/gap, or density logic changes colors | Violates separation of concerns | Each axis stays in its lane (§2) |
| Editing `src/components/theme/shadcn/*` for theme work | shadcn primitives must stay stock | Override via theme component layer or CSS tokens |
| Editing deep feature UI to fix theme issues (e.g. fixing a card in `FileGrid.tsx`) | Bypasses the wrapper contract | Fix in the wrapper (`AppCard`) or theme component (`VividCard`) |
| Using `as any` / `@ts-ignore` to silence theme type errors | Masks real type mismatches | Fix the type at the source (add to union, extend interface) |
| Adding a preset to CSS but not to `THEME_NAMES` / `NEXT_THEMES` | Preset exists in CSS but is unreachable at runtime | Always start from `theme-values.ts` — the canonical enum |
| Inline `style={{ color: ... }}` for themed values | Unresponsive to theme/mode changes | Use CSS custom properties via Tailwind classes |
| Creating a new `data-*` attribute without updating this doc | Undocumented DOM contract | Update §4 of this document |

### Per-preset CSS discipline

- All token overrides must be inside `@layer base { ... }`
- Selectors must match the exact `data-theme` format: `:root[data-theme="{preset}-{mode}"]`
- Never use `:root` without a `data-theme` selector in preset files (that's base.css's job)
- Preset files may set `--rv-radius-*` and `--radius` to establish default corner rounding, but wrapper logic for `radiusMode` overrides will still apply on top

---

## 9. Agent Workflow

### Before editing any theme file — read these first

1. **This document** — understand axis boundaries
2. `src/lib/theme/theme-values.ts` — current preset names and mode enum
3. `src/lib/theme/theme-meta.ts` — current preset metadata (labels, defaults, colors)
4. `src/lib/theme/layout-axes.ts` — density and radius types and defaults
5. The specific preset's CSS file in `src/styles/themes/` — understand existing tokens
6. `src/app/globals.css` — understand the import chain, `@theme` bridge, component-level `.rv-*` rules

### Files that must be updated together

| Change | Files to update simultaneously |
|---|---|
| New preset | `theme-values.ts` + `theme-meta.ts` + new CSS file + `globals.css` import + `src/components/themes/{name}/*` + `src/components/themes/index.tsx` + ThemePanel swatches/labels |
| New surface | `surfaces.ts` + `PageShell.tsx` + `PageHeader.tsx` (if needed) |
| New density value | `layout-axes.ts` + all wrappers (`AppButton`, `AppCard`, `AppInput`, `AppDialogContent`, `PageShell`, `PageHeader`) + `ThemePanel.tsx` |
| New radius mode | `layout-axes.ts` + all wrappers (`AppButton`, `AppCard`, `AppInput`, `AppDialogContent`) + `ThemePanel.tsx` |
| New semantic token | `base.css` (fallback) + all `src/styles/themes/*.css` + `globals.css` `@theme` block + `surfaces.ts` (if surface-related) |
| New wrapper component | `src/components/app/New.tsx` + theme-aware implementation + add to wrapper table in this doc |

### Validation checklist (run after every theme change)

- [ ] `npx tsc --noEmit` — no type errors
- [ ] Build succeeds (`next build` or project build command)
- [ ] Lint passes
- [ ] Toggle through all 4 presets × 2 modes in ThemePanel — no missing tokens (check for CSS `undefined` or fallback flash)
- [ ] Check density comfortable/compact — wrappers resize correctly
- [ ] Check radius default/rounded/sharp — corners change correctly
- [ ] Check all surfaces (`workspace`, `auth`, `marketing`, `admin`) — `PageShell` applies correct constraints
- [ ] No hardcoded colors visible when switching presets
- [ ] Dark mode: text readable against backgrounds, borders visible
- [ ] ThemePanel: new preset appears with correct label and swatches

---

## Appendix: Animation System

Each preset defines an enter animation keyframe in `globals.css`:

| Preset | Keyframe | Character |
|---|---|---|
| Vivid | `vivid-enter` | Soft scale + blur dissolve (springy) |
| Monochrome | `mono-enter` | Hard clip-reveal from left |
| Bauhaus | `bauhaus-enter` | Rotate-slide-in (constructivist) |
| Linear | `linear-enter` | Cinematic scale-in + blur |

Activated by:
1. `ThemeProvider` sets `anim-{preset}` class on `:root`
2. Components use `animate-enter` class
3. CSS rule `.anim-vivid .animate-enter { animation: var(--animate-enter-vivid); }` applies the correct keyframe

Linear also has unique ambient effects:
- Animated light blobs (`:root[data-theme^="linear-"]::before`) with `float` keyframe
- Noise texture overlay (`body::after`) via inline SVG
- Mouse-tracking spotlight in `LinearCard`

---

## Appendix: Storage Keys

| Key | Store | Contents |
|---|---|---|
| `theme` (next-themes) | Cookie | `"{preset}-{mode}"` e.g. `"vivid-light"` |
| `rv-theme-ui` | localStorage | `{ primaryColor: string, borderRadius: number }` |
| `rv-theme-layout` | localStorage | `{ density: Density, radiusMode: RadiusMode }` |
