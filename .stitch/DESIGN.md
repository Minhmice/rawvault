# Design System: RawVault Auth

**Purpose:** Login & Sign Up screens for RawVault — drive-lite for RAW photographers.

## 1. Visual Theme & Atmosphere

- **Mood:** Professional, photography-first, minimal
- **Density:** Generous whitespace, centered layout
- **Aesthetic:** Clean, trustworthy, no visual noise

## 2. Color Palette (from globals.css)

- **Background** (#f8fafc light / #030712 dark) – Page background
- **Surface** (#ffffff light / #111827 dark) – Card background
- **Border** (#e2e8f0 light / #374151 dark) – Input borders
- **Text Primary** (#0f172a light / #f9fafb dark) – Headlines
- **Text Muted** (#64748b light / #9ca3af dark) – Secondary copy
- **Primary** (#3b82f6) – CTA buttons, links
- **Primary Hover** (#2563eb light / #60a5fa dark)
- **Danger** (#ef4444 / #f87171) – Error states

## 3. Typography

- **Heading:** Outfit, bold, uppercase, tracking-widest
- **Body:** Inter, regular
- **Mono:** JetBrains Mono for labels

## 4. Component Stylings

- **Buttons:** Rounded (var(--rv-radius)), uppercase tracking, primary bg
- **Cards:** Rounded (var(--rv-radius)), border, subtle shadow
- **Inputs:** Rounded, border, focus ring

## 5. Layout Principles

- Centered content, max-w-md for auth card
- Padding p-6 on card
- Gap between form elements

## 6. Design System Notes for Stitch Generation

**Copy this block into every baton prompt:**

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Light/Dark adaptive, photography-first, minimal
- Background: Soft slate (#f8fafc) light / near-black (#030712) dark
- Surface: White (#ffffff) light / dark gray (#111827) dark for cards
- Primary Accent: Blue (#3b82f6) for buttons and links
- Text Primary: Slate (#0f172a) light / near-white (#f9fafb) dark
- Text Secondary: Muted gray (#64748b / #9ca3af)
- Font: Outfit for headings (uppercase, tracking), Inter for body
- Buttons: Rounded corners (9px), uppercase, comfortable padding
- Cards: Rounded (12px), border, subtle shadow
- Layout: Centered, max-width 28rem, generous whitespace
- No harsh shadows, no aggressive colors — serene and trustworthy
