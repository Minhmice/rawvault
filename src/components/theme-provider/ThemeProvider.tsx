"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTheme as useNextThemes } from "next-themes";
import { NextThemesProvider } from "./NextThemesProvider";
import { buildNextThemeValue, parseNextThemeValue, type ThemeMode, type ThemeName } from "@/lib/theme/config";
import { THEME_PRESETS } from "@/lib/theme/theme-meta";
import {
  DEFAULT_LAYOUT_AXES,
  parseDensity,
  parseRadiusMode,
  type Density,
  type LayoutAxesState,
  type RadiusMode,
} from "@/lib/theme/layout-axes";

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
  density: Density;
  setDensity: (density: Density) => void;
  radiusMode: RadiusMode;
  setRadiusMode: (mode: RadiusMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_UI: ThemeConfig = {
  primaryColor: THEME_PRESETS.vivid.primaryColor,
  borderRadius: THEME_PRESETS.vivid.borderRadius,
};

const LAYOUT_STORAGE_KEY = "rv-theme-layout";

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

function readInitialLayoutAxes(): LayoutAxesState {
  if (typeof window === "undefined") {
    return DEFAULT_LAYOUT_AXES;
  }

  const saved = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Partial<LayoutAxesState>;
      return {
        density: parseDensity(parsed.density, DEFAULT_LAYOUT_AXES.density),
        radiusMode: parseRadiusMode(parsed.radiusMode, DEFAULT_LAYOUT_AXES.radiusMode),
      };
    } catch {
      // fall through to legacy migration
    }
  }

  // Legacy migration: older builds stored density/radius modes inside rv-theme-ui
  // under `densityMode`/`radiusMode` (or `density`/`radius`).
  const legacy = window.localStorage.getItem("rv-theme-ui");
  if (!legacy) return DEFAULT_LAYOUT_AXES;
  try {
    const parsed = JSON.parse(legacy) as {
      densityMode?: unknown;
      density?: unknown;
      radiusMode?: unknown;
      radius?: unknown;
    };

    const legacyDensity = parsed.densityMode ?? parsed.density;
    const density = legacyDensity === "compact" ? "compact" : DEFAULT_LAYOUT_AXES.density;

    const legacyRadius = parsed.radiusMode ?? parsed.radius;
    const radiusMode =
      legacyRadius === "sharp"
        ? "sharp"
        : legacyRadius === "round" || legacyRadius === "soft"
          ? "rounded"
          : DEFAULT_LAYOUT_AXES.radiusMode;

    return { density, radiusMode };
  } catch {
    return DEFAULT_LAYOUT_AXES;
  }
}

function ThemeProviderInner({ children }: { children: ReactNode }) {
  const { theme, setTheme: setNextTheme } = useNextThemes();
  const { themeName, mode } = useMemo(() => parseNextThemeValue(theme), [theme]);
  const preset = THEME_PRESETS[themeName] ?? THEME_PRESETS.vivid;

  const [ui, setUi] = useState<ThemeConfig>(readInitialUi);
  const primaryColor = ui.primaryColor;
  const borderRadius = typeof ui.borderRadius === "number" ? ui.borderRadius : DEFAULT_UI.borderRadius;
  const [layoutAxes, setLayoutAxes] = useState<LayoutAxesState>(readInitialLayoutAxes);
  const density = layoutAxes.density;
  const radiusMode = layoutAxes.radiusMode;

  const setThemeUi = useCallback((updates: Partial<ThemeConfig>) => {
    setUi((prev) => {
      const nextUi: ThemeConfig = { ...prev, ...updates };
      window.localStorage.setItem("rv-theme-ui", JSON.stringify(nextUi));
      return nextUi;
    });
  }, []);

  const setLayout = useCallback((updates: Partial<LayoutAxesState>) => {
    setLayoutAxes((prev) => {
      const nextLayout: LayoutAxesState = {
        density: parseDensity(updates.density ?? prev.density, DEFAULT_LAYOUT_AXES.density),
        radiusMode: parseRadiusMode(updates.radiusMode ?? prev.radiusMode, DEFAULT_LAYOUT_AXES.radiusMode),
      };
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(nextLayout));
      return nextLayout;
    });
  }, []);

  const setDensity = useCallback((next: Density) => {
    setLayout({ density: next });
  }, [setLayout]);

  const setRadiusMode = useCallback((next: RadiusMode) => {
    setLayout({ radiusMode: next });
  }, [setLayout]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setNextTheme(buildNextThemeValue(themeName, nextMode));
  }, [setNextTheme, themeName]);

  const setThemeName = useCallback((nextName: ThemeName) => {
    setNextTheme(buildNextThemeValue(nextName, mode));
  }, [setNextTheme, mode]);

  const applyPreset = useCallback((name: ThemeName) => {
    const nextPreset = THEME_PRESETS[name] ?? THEME_PRESETS.vivid;
    setNextTheme(buildNextThemeValue(name, nextPreset.defaultMode));
    setThemeUi({ primaryColor: nextPreset.primaryColor, borderRadius: nextPreset.borderRadius });
  }, [setNextTheme, setThemeUi]);

  // Migrate legacy next-themes values (e.g. "vivid") to the new `${preset}-${mode}` scheme.
  useEffect(() => {
    if (typeof theme !== "string") return;
    const legacyMatch = theme.match(/^(vivid|monochrome|bauhaus|linear)$/);
    if (!legacyMatch) return;
    const legacyName = legacyMatch[1] as ThemeName;
    const legacyPreset = THEME_PRESETS[legacyName] ?? THEME_PRESETS.vivid;
    setNextTheme(buildNextThemeValue(legacyName, legacyPreset.defaultMode));
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
    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--ring", primaryColor);

    // Keep `--primary-foreground` readable when users customize primary.
    // Fall back to per-theme CSS if `primaryColor` isn't a hex.
    const hex = primaryColor.trim();
    const m = hex.match(/^#?([0-9a-f]{6})$/i);
    if (m) {
      const int = Number.parseInt(m[1], 16);
      const r8 = (int >> 16) & 0xff;
      const g8 = (int >> 8) & 0xff;
      const b8 = int & 0xff;
      const toLinear = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const rl = toLinear(r8);
      const gl = toLinear(g8);
      const bl = toLinear(b8);
      const luminance = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
      root.style.setProperty("--rv-primary-foreground", luminance > 0.5 ? "#0b0b0f" : "#ffffff");
    } else {
      root.style.removeProperty("--rv-primary-foreground");
    }

    root.setAttribute("data-density", density);
    root.setAttribute("data-radius", radiusMode);

    const r = borderRadius;
    root.style.setProperty("--rv-radius-lg", `${r}px`);
    root.style.setProperty("--rv-radius-md", `${r * 0.75}px`);
    root.style.setProperty("--rv-radius-sm", `${r * 0.5}px`);
    root.style.setProperty("--radius", `${r}px`);
  }, [themeName, mode, preset.animation, primaryColor, borderRadius, density, radiusMode]);

  const value = useMemo<ThemeContextType>(
    () => ({
      themeName,
      mode,
      setMode,
      setThemeName,
      primaryColor,
      borderRadius,
      radiusMode,
      setTheme: setThemeUi,
      applyPreset,
      density,
      setDensity,
      setRadiusMode,
    }),
    [
      themeName,
      mode,
      setMode,
      setThemeName,
      primaryColor,
      borderRadius,
      radiusMode,
      setThemeUi,
      applyPreset,
      density,
      setDensity,
      setRadiusMode,
    ]
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
