import type { NextThemeValue, ThemeMode, ThemeName } from "./theme-values";
import { NEXT_THEMES } from "./theme-values";

export type { NextThemeValue, ThemeMode, ThemeName };
export { NEXT_THEMES };

export const DEFAULT_THEME_NAME: ThemeName = "vivid";
export const DEFAULT_MODE: ThemeMode = "light";
export const DEFAULT_NEXT_THEME_VALUE: NextThemeValue = "vivid-light";

const NEXT_THEME_VALUE_RE = /^(vivid|monochrome|bauhaus|linear)-(light|dark)$/;

export function buildNextThemeValue(themeName: ThemeName, mode: ThemeMode): NextThemeValue {
  return `${themeName}-${mode}` as NextThemeValue;
}

export function parseNextThemeValue(value: string | undefined | null): { themeName: ThemeName; mode: ThemeMode } {
  if (!value) return { themeName: DEFAULT_THEME_NAME, mode: DEFAULT_MODE };
  const match = value.match(NEXT_THEME_VALUE_RE);
  if (!match) return { themeName: DEFAULT_THEME_NAME, mode: DEFAULT_MODE };
  return { themeName: match[1] as ThemeName, mode: match[2] as ThemeMode };
}

export function isNextThemeValue(value: string | undefined | null): value is NextThemeValue {
  if (!value) return false;
  return (NEXT_THEMES as readonly string[]).includes(value);
}

