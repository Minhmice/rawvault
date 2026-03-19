/**
 * Surface tokens are the “layer backgrounds” used across the UI.
 *
 * Source of truth is CSS custom properties in `src/styles/base.css`:
 * - `--rv-surface`
 * - `--rv-surface-muted`
 * - `--rv-surface-hover`
 *
 * This file provides a small, type-safe API so components can reference surfaces
 * without stringly-typed drift.
 */
export const SURFACE_IDS = ["default", "muted", "hover"] as const;
export type SurfaceId = (typeof SURFACE_IDS)[number];

export type SurfaceCssVar = "--rv-surface" | "--rv-surface-muted" | "--rv-surface-hover";

export const SURFACE_CSS_VARS: Record<SurfaceId, SurfaceCssVar> = {
  default: "--rv-surface",
  muted: "--rv-surface-muted",
  hover: "--rv-surface-hover",
} as const;

/**
 * Tailwind color aliases are wired in `src/app/globals.css` as:
 * - `--color-rv-surface` -> `var(--rv-surface)`
 * - `--color-rv-surface-muted` -> `var(--rv-surface-muted)`
 * - `--color-rv-surface-hover` -> `var(--rv-surface-hover)`
 */
export type SurfaceColorAliasVar =
  | "--color-rv-surface"
  | "--color-rv-surface-muted"
  | "--color-rv-surface-hover";

export const SURFACE_COLOR_ALIAS_VARS: Record<SurfaceId, SurfaceColorAliasVar> = {
  default: "--color-rv-surface",
  muted: "--color-rv-surface-muted",
  hover: "--color-rv-surface-hover",
} as const;

export function surfaceCssVar(id: SurfaceId): SurfaceCssVar {
  return SURFACE_CSS_VARS[id];
}

export function surfaceColorAliasVar(id: SurfaceId): SurfaceColorAliasVar {
  return SURFACE_COLOR_ALIAS_VARS[id];
}

export const SURFACE_NAMES = ["workspace", "marketing", "auth", "admin"] as const;

export type SurfaceName = (typeof SURFACE_NAMES)[number];

/**
 * Surface is a lightweight UI "area" marker (layout + density), not a theme preset.
 * Surfaces are meant to be safe to introduce incrementally via wrappers/layouts.
 */
export const DEFAULT_SURFACE: SurfaceName = "workspace";

export function isSurfaceName(value: unknown): value is SurfaceName {
  return typeof value === "string" && (SURFACE_NAMES as readonly string[]).includes(value);
}

