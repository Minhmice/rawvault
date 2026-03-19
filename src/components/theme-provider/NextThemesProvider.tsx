"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProviderBase } from "next-themes";
import { DEFAULT_NEXT_THEME_VALUE, NEXT_THEMES } from "@/lib/theme/config";

/**
 * next-themes owns:
 * - theme preset name + dark mode (persisted, SSR-safe)
 *
 * We model this as a single `data-theme` value on :root:
 * - `${preset}-${mode}` e.g. `vivid-light`, `linear-dark`
 */

export function NextThemesProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProviderBase
      attribute="data-theme"
      themes={NEXT_THEMES}
      defaultTheme={DEFAULT_NEXT_THEME_VALUE}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProviderBase>
  );
}

