"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProviderBase } from "next-themes";

/**
 * next-themes owns:
 * - theme preset name + dark mode (persisted, SSR-safe)
 *
 * We model this as a single `data-theme` value on :root:
 * - `${preset}-${mode}` e.g. `vivid-light`, `linear-dark`
 */

export type ThemeName = "vivid" | "monochrome" | "bauhaus" | "linear";
export type ThemeMode = "light" | "dark";
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

export function NextThemesProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProviderBase
      attribute="data-theme"
      themes={NEXT_THEMES}
      defaultTheme="vivid-light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProviderBase>
  );
}

