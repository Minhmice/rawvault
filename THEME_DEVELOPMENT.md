---
description: Guide for AI agents on how to safely integrate new themes into the RawVault architecture.
---

# RawVault Theme Development Guide

This document provides instructions for AI agents on how to add a new Theme to the RawVault UI Architecture without breaking existing structures or layout logic.

The system is designed around a **Proxy Pattern** + **CSS Variables**, strictly separating Logic and Aesthetic.

## 🏗 Architecture Overview

- **`ThemeProvider.tsx`**: Manages theme state, injecting `.theme-[name]` and `.anim-[name]` classes into the `<html>` root.
- **`globals.css`**: Defines CSS Variables (colors, border-radius, fonts, shadows) and Keyframes Animations for each theme.
- **`components/themes/[name]/`**: Contains the "Wrapper" components (e.g., Button, Card, Input) that define the hover/click behavior (Animation Personality) of the theme.
- **`components/themes/index.tsx`**: The proxy file. It dynamically routes components based on the active theme and provides the `useThemeComponents()` hook.

## 🛠 5-Step Process to Add a New Theme

### Step 1: Register the Theme in `ThemeProvider.tsx`
1. Add the new theme name to the `ThemeName` type.
2. Add the default configuration for the new theme into the `THEME_PRESETS` object (including name, label, appearance, accentColor, borderRadius, fontFamily, and animation).

### Step 2: Define CSS Tokens in `globals.css`
1. Create a new `.theme-[name]` block to override root CSS variables (e.g., `--rv-bg`, `--rv-surface`, `--rv-text`, `--rv-primary`, typography mapping).
2. If the theme requires specific Shadcn UI semantic mappings (e.g., `--background`, `--primary`), define them inside this block.
3. Define the entry keyframe animation (e.g., `@keyframes [name]-enter`) and map it inside the `.anim-[name] .animate-enter` selector.

### Step 3: Create Component Wrappers
1. Create a new directory: `components/themes/[name]/`.
2. Implement your base components (e.g., `Button.tsx`, `Card.tsx`, `Input.tsx`).
   - Maintain the standard interface (e.g., extending `ButtonProps`).
   - Define the **Animation Personality** using Tailwind classes inside the wrapper.
   - Render the base UI component (e.g., `<Button>`) and pass `...props` down.
   - Always ensure the `animate-enter` class is present on the root element so the component animates when mounted.

### Step 4: Register the Proxy in `components/themes/index.tsx`
1. Dynamically import the newly created wrapper components using `next/dynamic`.
2. Add the component mapping to the `switch (theme.name)` statement inside `useThemeComponents()`.
3. Add the static exports for the new components at the bottom of the file.

### Step 5: Map Behaviors in Layout / Composite Components
Large layout components and complex UI elements often have internal theme mappings or conditional classes to adjust specific visual elements (like navigation links, logos, overlay states, or progress indicators). You must locate these mappings and add the new theme styles to them.

Key UI Elements & Components to check and update:
- **Layout Composites (`Sidebar.tsx`, `FileGrid.tsx`, `Topbar.tsx`)**: Update map constants like `NAV_THEME`, `LOGO_THEME`, `FILE_HOVER_OVERLAY`, or `FOLDER_CARD_HOVER` to include the specific layout logic, padding, and hover behaviors for the new theme.
- **Interactive Core (`ThemeButton`, `ThemeCard`, `ThemeInput`)**: Ensure these core wrappers correctly implement the new theme's animation personality (e.g., easing curves, transition durations, multi-layer shadows, transforms).
- **Popovers & Overlays (`Tooltip`, `DropdownMenu`, `Dialog`, `ContextMenu`)**: Verify that the floating elements' background colors, border radius, border thickness, and drop shadows align with the new theme's aesthetic. Add theme-specific modifiers if they don't inherit correctly from global CSS.
- **Data Display (`Progress`, `Avatar`, `Badge`, `Separator`)**: Ensure indicators and structural elements reflect the theme. For instance, `Progress` bars might need explicit CSS variables passed via inline styles (e.g., `style={{ "--primary": ... }}`) or conditional rounded corners, while `Avatar` borders might need thickness adjustments.
- **`ThemePanel.tsx`**: Add the new theme's accent color palette to `ACCENT_PALETTES` and build a dedicated visual preset selection card in `THEME_CARDS` so the user can activate the new theme.
- **shadcn Sidebar Tokens**: Each `.theme-[name]` block should define `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` for consistent popover/sidebar styling.
- **UX Research**: See [docs/theme-ux-research.md](docs/theme-ux-research.md) for shadcn theming best practices and design token architecture.

---

## 🚫 Anti-Patterns (What NOT to do)

1. **Do NOT interfere with Core Logic:** Files in `components/workspace/` contain data logic. When styling, use the `useThemeComponents()` hook rather than hardcoding imports from specialized theme folders or base Shadcn folders. Use conditional rendering via `theme.name` where necessary.
2. **Do NOT use aggressive CSS wildcards:** Avoid using `[&_*]` globally (especially on hover) without intense scrutiny. Scope CSS classes exactly to the child elements that need it (e.g., use `group-hover:bg-foreground` on the specific inner container, not the root card) to prevent layout breakages like fully inverted preview images.
3. **Do NOT isolate CSS imports:** Put all theme variables and overrides into `globals.css` bound to the `.theme-[name]` selector. Avoid creating individual `.css` or `.module.css` files for a theme.
4. **Do NOT hardcode fonts in `layout.tsx` incorrectly:** If a new theme needs a new font, import it using `next/font/google` in `layout.tsx`, add it to the `fontVars` string with `display: "swap"`, and then map it cleanly inside `globals.css` as a CSS variable (e.g., `--font-heading`) under the `.theme-[name]` block.
