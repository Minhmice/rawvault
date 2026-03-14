"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeName = "vivid" | "monochrome" | "bauhaus" | "linear";

export type ThemeConfig = {
  name: ThemeName;
  label: string;
  mode: "light" | "dark";
  primaryColor: string;
  borderRadius: number; // 0–24 (pixels)
  fontFamily: "sans" | "serif" | "mono";
  animation: "vivid" | "monochrome" | "bauhaus" | "linear";
};

type ThemeContextType = {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  applyPreset: (name: ThemeName) => void;
};

// ─── Preset definitions ──────────────────────────────────────────────────────
export const THEME_PRESETS: Record<ThemeName, ThemeConfig> = {
  vivid: {
    name: "vivid",
    label: "Vivid",
    mode: "light",
    primaryColor: "#3b82f6",
    borderRadius: 12,
    fontFamily: "sans",
    animation: "vivid",
  },
  monochrome: {
    name: "monochrome",
    label: "Minimalist Monochrome",
    mode: "light",
    primaryColor: "#000000",
    borderRadius: 0,
    fontFamily: "serif",
    animation: "monochrome",
  },
  bauhaus: {
    name: "bauhaus",
    label: "Bauhaus",
    mode: "light",
    primaryColor: "#D02020",
    borderRadius: 0,
    fontFamily: "sans",
    animation: "bauhaus",
  },
  linear: {
    name: "linear",
    label: "Linear Cinematic",
    mode: "dark",
    primaryColor: "#5E6AD2",
    borderRadius: 8,
    fontFamily: "sans",
    animation: "linear",
  },
};

const defaultTheme: ThemeConfig = THEME_PRESETS.vivid;
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readInitialTheme(): ThemeConfig {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  const saved = window.localStorage.getItem("rv-theme");
  if (!saved) {
    return defaultTheme;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<ThemeConfig> & { borderRadius?: number | string };
    if (typeof parsed.borderRadius === "string") {
      const nextRadius = parseFloat(parsed.borderRadius) * 16;
      parsed.borderRadius = Number.isNaN(nextRadius) ? 12 : nextRadius;
    }
    return { ...defaultTheme, ...parsed };
  } catch {
    return defaultTheme;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(readInitialTheme);

  const setTheme = (updates: Partial<ThemeConfig>) => {
    setThemeState((prev) => {
      const newTheme = { ...prev, ...updates };
      localStorage.setItem("rv-theme", JSON.stringify(newTheme));
      return newTheme;
    });
  };

  const applyPreset = (name: ThemeName) => {
    const preset = THEME_PRESETS[name];
    setThemeState(() => {
      localStorage.setItem("rv-theme", JSON.stringify(preset));
      return preset;
    });
  };

  useEffect(() => {
    const root = document.documentElement;

    // Dark mode class
    if (theme.mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Named theme class (theme-vivid | theme-monochrome | theme-bauhaus)
    root.className = root.className.replace(/\btheme-[^\s]+\b/g, "");
    root.classList.add(`theme-${theme.name}`);

    // Animation class
    root.className = root.className.replace(/\banim-[^\s]+\b/g, "");
    root.classList.add(`anim-${theme.animation}`);

    // Dynamic CSS variables
    root.style.setProperty("--rv-primary", theme.primaryColor);
    const r = theme.borderRadius;
    root.style.setProperty("--rv-radius-lg", `${r}px`);
    root.style.setProperty("--rv-radius-md", `${r * 0.75}px`);
    root.style.setProperty("--rv-radius-sm", `${r * 0.5}px`);
    root.style.setProperty("--radius", `${r}px`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, applyPreset }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
