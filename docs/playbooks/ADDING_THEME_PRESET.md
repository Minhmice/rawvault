# Playbook: Adding a Theme Preset

> Step-by-step checklist for adding a new theme preset to the RawVault theme system.
> **Prerequisite**: Read [`docs/architecture/THEME_SYSTEM.md`](../architecture/THEME_SYSTEM.md) first.

---

## Pre-flight

- [ ] Decide on preset name (lowercase, single word, alphanumeric — e.g. `nordic`)
- [ ] Decide on default mode (`light` or `dark`)
- [ ] Decide on font families (heading, body, mono)
- [ ] Decide on primary accent color (hex)
- [ ] Decide on default border-radius (px)
- [ ] Decide on animation personality (enter animation character)

---

## Step 1: Add preset to `THEME_NAMES`

**File**: `src/lib/theme/theme-values.ts`

```ts
// BEFORE
export const THEME_NAMES = ["vivid", "monochrome", "bauhaus", "linear"] as const;

// AFTER
export const THEME_NAMES = ["vivid", "monochrome", "bauhaus", "linear", "nordic"] as const;
```

Then update `NEXT_THEMES` in the same file:

```ts
// Add both mode variants
export const NEXT_THEMES: NextThemeValue[] = [
  // ... existing entries
  "nordic-light",
  "nordic-dark",
];
```

### Validation
- [ ] `ThemeName` type now includes `"nordic"` (inferred from `THEME_NAMES`)
- [ ] `NextThemeValue` type now includes `"nordic-light" | "nordic-dark"` (inferred from template literal)

---

## Step 2: Add metadata to `THEME_PRESETS`

**File**: `src/lib/theme/theme-meta.ts`

```ts
export const THEME_PRESETS: Record<ThemeName, { ... }> = {
  // ... existing presets
  nordic: {
    label: "Nordic",
    defaultMode: "light",
    primaryColor: "#2563eb",
    borderRadius: 8,
    fontFamily: "sans",
    animation: "nordic",
  },
};
```

### Fields

| Field | Type | Purpose |
|---|---|---|
| `label` | `string` | Display name in ThemePanel |
| `defaultMode` | `ThemeMode` | Mode applied when preset is first selected |
| `primaryColor` | `string` | Default accent (hex) — overridable by user in ThemePanel |
| `borderRadius` | `number` | Default border-radius in px |
| `fontFamily` | `"sans" \| "serif" \| "mono"` | Font classification (informational) |
| `animation` | `ThemeName` | Animation class suffix — determines which `anim-{name}` class is set on `:root` |

### Validation
- [ ] TypeScript compiles — `THEME_PRESETS` Record is exhaustive over `ThemeName`

---

## Step 3: Create CSS file

**File**: `src/styles/themes/nordic.css`

Create the file with **both light and dark selectors** inside `@layer base`:

```css
/* ═══════════════════════════════════════════
   THEME: NORDIC
   Fonts: [heading] + [body]
   ═══════════════════════════════════════════ */
@layer base {
  :root[data-theme="nordic-light"] {
    /* ── RawVault semantic tokens ── */
    --rv-bg: #f5f7fa;
    --rv-surface: #ffffff;
    --rv-surface-muted: #edf0f5;
    --rv-surface-hover: #dde3ec;
    --rv-border: #c8cfd8;
    --rv-text: #1a1f2e;
    --rv-text-muted: #5a6275;
    --rv-text-subtle: #8b95a8;
    --rv-primary: #2563eb;
    --rv-primary-hover: #1d4ed8;
    --rv-danger: #dc2626;

    /* ── Radius defaults ── */
    --rv-radius-lg: 8px;
    --rv-radius-md: 6px;
    --rv-radius-sm: 4px;
    --radius: 8px;

    /* ── Typography ── */
    --font-heading: var(--font-inter, 'Inter', sans-serif);
    --font-sans: var(--font-inter, 'Inter', sans-serif);
    --font-mono: var(--font-jetbrains-mono, 'JetBrains Mono', monospace);

    /* ── shadcn tokens (light) ── */
    --background: oklch(0.98 0 0);
    --foreground: oklch(0.15 0 0);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.15 0 0);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.15 0 0);
    --primary: var(--rv-primary);
    --primary-foreground: var(--rv-primary-foreground, oklch(0.98 0 0));
    --secondary: oklch(0.96 0 0);
    --secondary-foreground: oklch(0.2 0 0);
    --muted: oklch(0.96 0 0);
    --muted-foreground: oklch(0.55 0 0);
    --accent: oklch(0.96 0 0);
    --accent-foreground: oklch(0.2 0 0);
    --destructive: oklch(0.58 0.24 27);
    --destructive-foreground: oklch(0.98 0 0);
    --border: oklch(0.82 0 0);
    --input: oklch(0.82 0 0);
    --ring: var(--rv-primary);

    /* ── Charts ── */
    --chart-1: var(--rv-primary);
    --chart-2: var(--rv-success);
    --chart-3: var(--rv-warning);
    --chart-4: var(--rv-file-video);
    --chart-5: var(--rv-danger);

    /* ── Sidebar ── */
    --sidebar: oklch(0.97 0 0);
    --sidebar-foreground: oklch(0.2 0 0);
    --sidebar-primary: var(--rv-primary);
    --sidebar-primary-foreground: oklch(0.98 0 0);
    --sidebar-accent: oklch(0.96 0 0);
    --sidebar-accent-foreground: oklch(0.2 0 0);
    --sidebar-border: oklch(0.82 0 0);
    --sidebar-ring: var(--rv-primary);
  }

  :root[data-theme="nordic-dark"] {
    /* ── RawVault semantic tokens ── */
    --rv-bg: #0c0f16;
    --rv-surface: #151923;
    --rv-surface-muted: #1e2433;
    --rv-surface-hover: #2a3245;
    --rv-border: #2e3650;
    --rv-text: #e8ecf2;
    --rv-text-muted: #8b95a8;
    --rv-text-subtle: #5a6275;
    --rv-primary: #3b82f6;
    --rv-primary-hover: #60a5fa;
    --rv-danger: #f87171;

    /* ── Typography ── */
    --font-heading: var(--font-inter, 'Inter', sans-serif);
    --font-sans: var(--font-inter, 'Inter', sans-serif);
    --font-mono: var(--font-jetbrains-mono, 'JetBrains Mono', monospace);

    /* ── shadcn tokens (dark) ── */
    --background: oklch(0.15 0 0);
    --foreground: oklch(0.95 0 0);
    --card: oklch(0.2 0 0);
    --card-foreground: oklch(0.95 0 0);
    --popover: oklch(0.2 0 0);
    --popover-foreground: oklch(0.95 0 0);
    --primary: var(--rv-primary);
    --primary-foreground: var(--rv-primary-foreground, oklch(0.98 0 0));
    --secondary: oklch(0.25 0 0);
    --secondary-foreground: oklch(0.95 0 0);
    --muted: oklch(0.25 0 0);
    --muted-foreground: oklch(0.65 0 0);
    --accent: oklch(0.25 0 0);
    --accent-foreground: oklch(0.95 0 0);
    --destructive: oklch(0.7 0.19 22);
    --destructive-foreground: oklch(0.98 0 0);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: var(--rv-primary);

    --chart-1: var(--rv-primary);
    --chart-2: var(--rv-success);
    --chart-3: var(--rv-warning);
    --chart-4: var(--rv-file-video);
    --chart-5: var(--rv-danger);

    --sidebar: oklch(0.17 0 0);
    --sidebar-foreground: oklch(0.95 0 0);
    --sidebar-primary: var(--rv-primary);
    --sidebar-primary-foreground: oklch(0.98 0 0);
    --sidebar-accent: oklch(0.25 0 0);
    --sidebar-accent-foreground: oklch(0.95 0 0);
    --sidebar-border: oklch(1 0 0 / 10%);
    --sidebar-ring: var(--rv-primary);
  }
}
```

### Required token checklist

- [ ] All `--rv-*` tokens from base.css that you want to customize
- [ ] `--rv-radius-lg`, `--rv-radius-md`, `--rv-radius-sm`, `--radius`
- [ ] `--font-heading`, `--font-sans`, `--font-mono`
- [ ] All shadcn tokens: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`
- [ ] All `--chart-*` tokens (1–5)
- [ ] All `--sidebar-*` tokens
- [ ] Both `{preset}-light` and `{preset}-dark` selectors defined

---

## Step 4: Import CSS in globals.css

**File**: `src/app/globals.css`

Add the import alongside existing theme imports:

```css
@import "../styles/themes/nordic.css";
```

### Validation
- [ ] Import is at top level alongside other theme imports
- [ ] No duplicate imports

---

## Step 5: Create theme components

**Directory**: `src/components/themes/nordic/`

Create three files:

### `src/components/themes/nordic/Button.tsx`

```tsx
"use client"
import * as React from "react"
import { Button as ShadcnButton, buttonVariants } from "@/components/theme/shadcn/button"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export interface NordicButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const NordicButton = React.forwardRef<HTMLButtonElement, NordicButtonProps>(
  ({ className, variant = "default", size, ...props }, ref) => {
    return (
      <ShadcnButton
        ref={ref}
        className={cn(
          // Define animation personality here
          "transition-all duration-200",
          "animate-enter",
          className
        )}
        variant={variant}
        size={size}
        {...props}
      />
    )
  }
)
NordicButton.displayName = "NordicButton"

export { NordicButton }
```

### `src/components/themes/nordic/Card.tsx`

```tsx
"use client"
import * as React from "react"
import { Card } from "@/components/theme/shadcn/card"
import { cn } from "@/lib/utils"

export interface NordicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

const NordicCard = React.forwardRef<HTMLDivElement, NordicCardProps>(
  ({ className, glass, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "cursor-pointer animate-enter",
          // Define card personality here
          glass ? "glass" : "",
          className
        )}
        {...props}
      />
    )
  }
)
NordicCard.displayName = "NordicCard"

export { NordicCard }
```

### `src/components/themes/nordic/Input.tsx`

```tsx
"use client"
import * as React from "react"
import { Input as ShadcnInput } from "@/components/theme/shadcn/input"
import { cn } from "@/lib/utils"

export interface NordicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const NordicInput = React.forwardRef<HTMLInputElement, NordicInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <ShadcnInput
        ref={ref}
        className={cn("", className)}
        {...props}
      />
    )
  }
)
NordicInput.displayName = "NordicInput"

export { NordicInput }
```

### Validation
- [ ] Each component wraps the shadcn primitive, not raw HTML
- [ ] Each component accepts `className` and forwards `ref`
- [ ] Button accepts `variant` and `size` from `buttonVariants`
- [ ] Card accepts `glass` prop
- [ ] All use `"use client"` directive

---

## Step 6: Register in theme component proxy

**File**: `src/components/themes/index.tsx`

Add imports and switch case:

```tsx
// Nordic
import { NordicButton } from "./nordic/Button"
import { NordicCard } from "./nordic/Card"
import { NordicInput } from "./nordic/Input"

export function useThemeComponents() {
  const { themeName } = useTheme()
  switch (themeName) {
    // ... existing cases
    case "nordic":
      return { ThemeButton: NordicButton, ThemeCard: NordicCard, ThemeInput: NordicInput }
    default:
      return { ThemeButton: VividButton, ThemeCard: VividCard, ThemeInput: VividInput }
  }
}

// Add static re-exports
export { NordicButton, NordicCard, NordicInput }
```

### Validation
- [ ] Switch case matches the exact string from `THEME_NAMES`
- [ ] All three components are returned in the object
- [ ] Static re-exports added at bottom

---

## Step 7: Add enter animation

**File**: `src/app/globals.css`

Add in the `@theme { ... }` block:

```css
--animate-enter-nordic: nordic-enter 0.4s ease-out both;

@keyframes nordic-enter {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Add the animation delegation rule (after existing `.anim-*` rules):

```css
.anim-nordic .animate-enter { animation: var(--animate-enter-nordic); }
```

### Validation
- [ ] Keyframe name matches pattern `{preset}-enter`
- [ ] `--animate-enter-{preset}` CSS variable defined
- [ ] `.anim-{preset} .animate-enter` delegation rule added

---

## Step 8: Add component-level `.rv-*` rules (if needed)

**File**: `src/app/globals.css`

If your preset needs custom styling for shared UI elements (sidebar nav, topbar buttons, folder cards, etc.), add rules following the existing pattern:

```css
/* Inside @layer components { ... } */
:root[data-theme^="nordic-"] .rv-topbar-btn {
  @apply rounded-lg hover:bg-muted/80 duration-200;
}
:root[data-theme^="nordic-"] .rv-topbar-search {
  @apply rounded-lg border-input focus-within:ring-2 focus-within:ring-primary/20;
}
/* ... etc for rv-sidebar-nav-item, rv-folder-card-hover, etc. */
```

### Validation
- [ ] Selectors use `:root[data-theme^="nordic-"]` (prefix match — works for both light and dark)
- [ ] Rules are inside `@layer components { ... }`
- [ ] No hardcoded colors — use semantic tokens (`var(--rv-*)`, Tailwind token classes)

---

## Step 9: Update ThemePanel display data

**File**: `src/components/theme-editor/ThemePanel.tsx`

The ThemePanel iterates `THEME_NAMES` and `THEME_PRESETS` automatically. However, you need to add entries to these local lookup maps (if they exist in the file):

- [ ] `ACCENT_PALETTES` — add a palette array for the new preset
- [ ] `THEME_SWATCHES` — add color swatches for the preset picker card
- [ ] `THEME_LABEL_KEYS` — add i18n key for the preset label
- [ ] `THEME_SUBTITLE_KEYS` — add i18n key for the preset subtitle

### Validation
- [ ] ThemePanel renders the new preset in the "Design Systems" section
- [ ] Clicking the preset calls `applyPreset("nordic")`
- [ ] Swatches display correct brand colors

---

## Step 10: Update `config.ts` regex

**File**: `src/lib/theme/config.ts`

Update the regex that validates next-theme values:

```ts
// BEFORE
const NEXT_THEME_VALUE_RE = /^(vivid|monochrome|bauhaus|linear)-(light|dark)$/;

// AFTER
const NEXT_THEME_VALUE_RE = /^(vivid|monochrome|bauhaus|linear|nordic)-(light|dark)$/;
```

### Validation
- [ ] `parseNextThemeValue("nordic-light")` returns `{ themeName: "nordic", mode: "light" }`
- [ ] `isNextThemeValue("nordic-dark")` returns `true`

---

## Final Validation

### Build & lint

- [ ] `npx tsc --noEmit` passes — no type errors
- [ ] Build succeeds (e.g. `next build`)
- [ ] Lint passes

### Visual QA matrix

Test **all combinations** — open ThemePanel and verify:

| Check | Preset-light | Preset-dark |
|---|---|---|
| Background color correct | [ ] | [ ] |
| Text readable (foreground vs background contrast) | [ ] | [ ] |
| Primary accent visible on buttons | [ ] | [ ] |
| Card surfaces distinguish from page background | [ ] | [ ] |
| Borders visible but not overwhelming | [ ] | [ ] |
| Muted text readable but clearly secondary | [ ] | [ ] |
| Sidebar renders with correct sidebar-* tokens | [ ] | [ ] |
| Popover/dropdown bg distinct from page | [ ] | [ ] |
| Destructive actions clearly red/danger-toned | [ ] | [ ] |
| Charts render with distinguishable colors | [ ] | [ ] |

### Wrapper checks

| Check | ✓ |
|---|---|
| `AppButton` renders with preset's animation personality | [ ] |
| `AppCard` renders with preset's hover behavior | [ ] |
| `AppInput` renders with preset's styling | [ ] |
| Density `compact` reduces button/card/input sizing | [ ] |
| Density `comfortable` uses default sizing | [ ] |
| Radius `rounded` adds extra rounding | [ ] |
| Radius `sharp` reduces rounding | [ ] |
| Radius `default` uses preset's native radius | [ ] |
| `PageShell` applies correct constraints per surface | [ ] |
| Enter animation plays on page navigation | [ ] |

### Cross-preset regression

After adding the new preset, quickly toggle through ALL existing presets to verify nothing broke:

- [ ] Vivid light + dark renders correctly
- [ ] Monochrome light + dark renders correctly
- [ ] Bauhaus light + dark renders correctly
- [ ] Linear light + dark renders correctly

---

## File Summary

All files that must be created or modified:

| Action | File |
|---|---|
| **Modify** | `src/lib/theme/theme-values.ts` |
| **Modify** | `src/lib/theme/theme-meta.ts` |
| **Modify** | `src/lib/theme/config.ts` |
| **Create** | `src/styles/themes/nordic.css` |
| **Modify** | `src/app/globals.css` (import + animation + `.rv-*` rules) |
| **Create** | `src/components/themes/nordic/Button.tsx` |
| **Create** | `src/components/themes/nordic/Card.tsx` |
| **Create** | `src/components/themes/nordic/Input.tsx` |
| **Modify** | `src/components/themes/index.tsx` |
| **Modify** | `src/components/theme-editor/ThemePanel.tsx` (palettes, swatches, labels) |

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Forgot to add to `NEXT_THEMES` array | Preset won't persist across page loads — add both `"{name}-light"` and `"{name}-dark"` |
| Forgot to update regex in `config.ts` | `parseNextThemeValue` will fall back to vivid — update the alternation group |
| Defined only light variant in CSS | Dark mode will show base.css fallback tokens — always define both selectors |
| Used `oklch()` without checking contrast | Test in both modes — some oklch values render differently across browsers |
| Forgot `@layer base` in CSS file | Token specificity issues — theme won't override base.css correctly |
| Forgot animation delegation rule | `.animate-enter` elements won't animate — add `.anim-{name} .animate-enter` rule |
| Imported CSS file but not in correct position | Import order matters for specificity — place alongside other theme imports |
