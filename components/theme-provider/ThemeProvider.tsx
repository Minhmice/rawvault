"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTheme as useNextThemes } from "next-themes";
import type { NextThemeValue, ThemeMode, ThemeName } from "./NextThemesProvider";
import { NextThemesProvider } from "./NextThemesProvider";

export type ThemeConfig = {
  primaryColor: string;
  borderRadius: number; // 0–24 (pixels)
};

type ThemeContextType = {
  themeName: ThemeName;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  setThemeName: (name: ThemeName) => void;
  primaryColor: string;
  borderRadius: number;
  setTheme: (updates: Partial<ThemeConfig>) => void;
  applyPreset: (name: ThemeName) => void;
};

// ─── Preset definitions ──────────────────────────────────────────────────────
export const THEME_PRESETS: Record<
  ThemeName,
  { label: string; defaultMode: ThemeMode; primaryColor: string; borderRadius: number; fontFamily: "sans" | "serif" | "mono"; animation: ThemeName }
> = {
  vivid: {
    label: "Vivid",
    defaultMode: "light",
    primaryColor: "#3b82f6",
    borderRadius: 12,
    fontFamily: "sans",
    animation: "vivid",
  },
  monochrome: {
    label: "Minimalist Monochrome",
    defaultMode: "light",
    primaryColor: "#000000",
    borderRadius: 0,
    fontFamily: "serif",
    animation: "monochrome",
  },
  bauhaus: {
    label: "Bauhaus",
    defaultMode: "light",
    primaryColor: "#D02020",
    borderRadius: 0,
    fontFamily: "sans",
    animation: "bauhaus",
  },
  linear: {
    label: "Linear Cinematic",
    defaultMode: "dark",
    primaryColor: "#5E6AD2",
    borderRadius: 8,
    fontFamily: "sans",
    animation: "linear",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEME_NAME: ThemeName = "vivid";
const DEFAULT_MODE: ThemeMode = "light";
const DEFAULT_UI: ThemeConfig = {
  primaryColor: THEME_PRESETS.vivid.primaryColor,
  borderRadius: THEME_PRESETS.vivid.borderRadius,
};

function parseNextThemeValue(value: string | undefined | null): { themeName: ThemeName; mode: ThemeMode } {
  if (!value) return { themeName: DEFAULT_THEME_NAME, mode: DEFAULT_MODE };
  const match = value.match(/^(vivid|monochrome|bauhaus|linear)-(light|dark)$/);
  if (!match) return { themeName: DEFAULT_THEME_NAME, mode: DEFAULT_MODE };
  return { themeName: match[1] as ThemeName, mode: match[2] as ThemeMode };
}

function toNextThemeValue(themeName: ThemeName, mode: ThemeMode): NextThemeValue {
  return `${themeName}-${mode}` as NextThemeValue;
}

function readInitialUi(): ThemeConfig {
  if (typeof window === "undefined") {
    return DEFAULT_UI;
  }

  const saved = window.localStorage.getItem("rv-theme-ui");
  if (!saved) {
    return DEFAULT_UI;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<ThemeConfig> & { borderRadius?: number | string };
    if (typeof parsed.borderRadius === "string") {
      const nextRadius = parseFloat(parsed.borderRadius) * 16;
      parsed.borderRadius = Number.isNaN(nextRadius) ? 12 : nextRadius;
    }
    return { ...DEFAULT_UI, ...parsed };
  } catch {
    return DEFAULT_UI;
  }
}

function ThemeProviderInner({ children }: { children: ReactNode }) {
  const { theme, setTheme: setNextTheme } = useNextThemes();
  const { themeName, mode } = useMemo(() => parseNextThemeValue(theme), [theme]);
  const preset = THEME_PRESETS[themeName] ?? THEME_PRESETS.vivid;

  const [ui, setUi] = useState<ThemeConfig>(readInitialUi);
  const primaryColor = ui.primaryColor;
  const borderRadius = typeof ui.borderRadius === "number" ? ui.borderRadius : DEFAULT_UI.borderRadius;

  const setThemeUi = useCallback((updates: Partial<ThemeConfig>) => {
    setUi((prev) => {
      const nextUi = { ...prev, ...updates };
      window.localStorage.setItem("rv-theme-ui", JSON.stringify(nextUi));
      return nextUi;
    });
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setNextTheme(toNextThemeValue(themeName, nextMode));
  }, [setNextTheme, themeName]);

  const setThemeName = useCallback((nextName: ThemeName) => {
    setNextTheme(toNextThemeValue(nextName, mode));
  }, [setNextTheme, mode]);

  const applyPreset = useCallback((name: ThemeName) => {
    const nextPreset = THEME_PRESETS[name] ?? THEME_PRESETS.vivid;
    setNextTheme(toNextThemeValue(name, nextPreset.defaultMode));
    setThemeUi({ primaryColor: nextPreset.primaryColor, borderRadius: nextPreset.borderRadius });
  }, [setNextTheme, setThemeUi]);

  // Migrate legacy next-themes values (e.g. "vivid") to the new `${preset}-${mode}` scheme.
  useEffect(() => {
    if (typeof theme !== "string") return;
    const legacyMatch = theme.match(/^(vivid|monochrome|bauhaus|linear)$/);
    if (!legacyMatch) return;
    const legacyName = legacyMatch[1] as ThemeName;
    const legacyPreset = THEME_PRESETS[legacyName] ?? THEME_PRESETS.vivid;
    setNextTheme(toNextThemeValue(legacyName, legacyPreset.defaultMode));
  }, [theme, setNextTheme]);

  useEffect(() => {
    const root = document.documentElement;

    // Compatibility classes. next-themes is the source of truth via `data-theme`,
    // but existing CSS/components may still target these classes.
    root.classList.toggle("dark", mode === "dark");
    root.className = root.className.replace(/\btheme-[^\s]+\b/g, "");
    root.classList.add(`theme-${themeName}`);

    // Animation class
    root.className = root.className.replace(/\banim-[^\s]+\b/g, "");
    root.classList.add(`anim-${preset.animation}`);

    // Dynamic CSS variables
    root.style.setProperty("--rv-primary", primaryColor);
    const r = borderRadius;
    root.style.setProperty("--rv-radius-lg", `${r}px`);
    root.style.setProperty("--rv-radius-md", `${r * 0.75}px`);
    root.style.setProperty("--rv-radius-sm", `${r * 0.5}px`);
    root.style.setProperty("--radius", `${r}px`);
  }, [themeName, mode, preset.animation, primaryColor, borderRadius]);

  const value = useMemo<ThemeContextType>(
    () => ({
      themeName,
      mode,
      setMode,
      setThemeName,
      primaryColor,
      borderRadius,
      setTheme: setThemeUi,
      applyPreset,
    }),
    [themeName, mode, setMode, setThemeName, primaryColor, borderRadius, setThemeUi, applyPreset]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider>
      <ThemeProviderInner>{children}</ThemeProviderInner>
    </NextThemesProvider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export type { ThemeName, ThemeMode };
