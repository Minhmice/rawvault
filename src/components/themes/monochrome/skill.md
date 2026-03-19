# Monochrome Theme Skill (RawVault)

Use this file as the implementation contract for all future monochrome UI work.
Goal: keep style quality high while reducing component and folder chaos.

## 1) Mission

You are implementing a strict editorial monochrome design system for a Next.js + Tailwind + shadcn codebase.
Every change must improve:

- visual consistency
- component composability
- predictable theming behavior
- long-term maintainability

## 2) Current Stack Assumptions

- App framework: Next.js (App Router), React client components.
- Styling: Tailwind utility classes + CSS variables from ThemeProvider.
- UI base: shadcn primitives in `components/theme/shadcn`.
- Theme selector: `components/themes/index.tsx` via `useThemeComponents()`.
- Workspace feature UI: currently under `components/workspace`.

## 3) Non-Negotiable Monochrome Rules

### Visual Rules

- Colors: black, white, and neutral grays only.
- Radius: `0` for interactive controls and cards.
- Shadows: none for core controls.
- Emphasis: use inversion, border weight, and typography scale.

### Motion Rules

- Interactions are binary and fast.
- Duration range: `60ms - 100ms`.
- Prefer `steps(1)` for monochrome flip transitions.
- No bounce, spring, float, glow, or decorative easing.

### Accessibility Rules

- Use `focus-visible` for keyboard focus indicators.
- Keep contrast at AA or better in all states.
- Touch targets should remain usable at mobile sizes.
- Never remove focus indication without replacing it.

## 4) Component Contracts (Button / Card / Input)

These contracts align with:

- `components/themes/monochrome/Button.tsx`
- `components/themes/monochrome/Card.tsx`
- `components/themes/monochrome/Input.tsx`

### Button Contract

- Shape: sharp rectangle (`rounded-none`).
- Typography: uppercase + wide tracking.
- Interaction: invert background/text quickly.
- Variants must keep the same monochrome interaction personality.

### Card Contract

- Default: `border-2`, no shadow, no radius.
- Avoid wildcard child color inversion (`[&_*]`) at card root.
- Card shell can invert; content-level inversion is opt-in per consumer.

### Input Contract

- Border strategy: bottom border emphasis is preferred.
- Focus behavior: bottom border thickens instantly.
- No colorful ring/glow; line weight is primary feedback.

## 5) Architecture Rules To Stop Theme Drift

Do not hardcode per-theme style maps inside feature components (for example inside FileGrid or Sidebar).
Theme-specific mappings must live in dedicated theme style modules.

### Required Separation

- Feature logic: data/state/interaction intent.
- Themed presentation: class recipes and visual variants.
- Shared primitives: base UI wrappers around shadcn.

## 6) Recommended New Folder Structure

Use this target structure for refactor planning:

```txt
components/
  ui/
    primitives/
      Button.tsx
      Card.tsx
      Input.tsx
    themes/
      registry.ts
      monochrome/
        tokens.ts
        motion.ts
        recipes.ts
        Button.tsx
        Card.tsx
        Input.tsx
      vivid/
      bauhaus/
      linear/

  features/
    workspace/
      layout/
        DashboardLayout.tsx
        Sidebar.tsx
        Topbar.tsx
      file-explorer/
        FileGrid.tsx
        file-grid.theme.ts
      vault/
        VaultClient.tsx

  theme/
    shadcn/
      ...
```

## 7) File Ownership Rules

- `components/ui/primitives/*`: reusable, theme-agnostic wrappers.
- `components/ui/themes/<name>/*`: theme-specific implementations.
- `components/features/workspace/*`: business UI and feature composition.
- `*.theme.ts`: classes/recipes selected by theme name, no business logic.

## 8) Refactor Playbook (Phased)

### Phase 1: Stabilize Theme API

- Keep `useThemeComponents()` as compatibility layer.
- Add a typed theme registry object instead of large switch chains.
- Centralize `ThemeName` type and avoid duplicate unions.

### Phase 2: Extract Theme Recipes

- Move `FILE_HOVER_OVERLAY`, `FOLDER_CARD_HOVER`, nav style maps, and logo style maps
  out of feature components into `*.theme.ts` files.
- Feature components should import recipe helpers, not raw theme maps.

### Phase 3: Re-home Workspace

- Split `components/workspace` into `features/workspace/layout`, `file-explorer`, and `vault`.
- Keep container components thin; extract repeatable visual blocks.

### Phase 4: Enforce Contracts

- Add lint-friendly conventions (naming + location rules).
- Add snapshot or visual regression checks for monochrome states.
- Add simple checklist in PR template for focus/contrast/motion compliance.

## 9) Implementation Checklist (Use On Every New Component)

- Is the component in the correct layer (primitive/theme/feature)?
- Are theme-specific classes outside business logic files?
- Does monochrome interaction respect 60-100ms binary transitions?
- Are focus-visible states present and obvious?
- Are radius/shadow/color rules compliant?
- Is there duplication that should be extracted to recipe/token modules?

## 10) Anti-Patterns (Block In Review)

- Theme maps embedded in feature files.
- Mixed design languages inside one component (e.g. monochrome + vivid effects).
- Decorative motion longer than 100ms in monochrome controls.
- One-off utility soups duplicated across components.
- Adding new theme-specific behavior without updating theme recipes.

## 11) Definition of Done

A change is done when:

- style and behavior match monochrome contracts,
- architecture becomes simpler than before,
- workspace components are easier to navigate,
- and future themed components can be added with minimal duplication.