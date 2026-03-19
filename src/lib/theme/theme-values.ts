export const THEME_NAMES = ["vivid", "monochrome", "bauhaus", "linear"] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export const THEME_MODES = ["light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export type NextThemeValue = `${ThemeName}-${ThemeMode}`;

export const NEXT_THEMES: NextThemeValue[] = [
  "vivid-light",
  "vivid-dark",
  "monochrome-light",
  "monochrome-dark",
  "bauhaus-light",
  "bauhaus-dark",
  "linear-light",
  "linear-dark",
];

