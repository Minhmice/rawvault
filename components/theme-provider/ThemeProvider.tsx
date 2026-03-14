"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeConfig = {
  mode: "light" | "dark";
  primaryColor: string;
  borderRadius: string;
  fontFamily: "sans" | "mono"; // Simple font toggle for demo
};

type ThemeContextType = {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
};

const defaultTheme: ThemeConfig = {
  mode: "light",
  primaryColor: "#3b82f6",
  borderRadius: "1rem",
  fontFamily: "sans",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem("rv-theme");
    if (saved) {
      try {
        setThemeState(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
    setMounted(true);
  }, []);

  const setTheme = (updates: Partial<ThemeConfig>) => {
    setThemeState((prev) => {
      const newTheme = { ...prev, ...updates };
      localStorage.setItem("rv-theme", JSON.stringify(newTheme));
      return newTheme;
    });
  };

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    
    // Apply dark mode
    if (theme.mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply primary color and border radius dynamically
    root.style.setProperty("--rv-primary", theme.primaryColor);
    root.style.setProperty("--rv-radius-lg", theme.borderRadius);

    // Provide scaled corner radii
    const radiusVal = parseFloat(theme.borderRadius);
    const unit = theme.borderRadius.replace(/[0-9.]/g, '');
    if (!isNaN(radiusVal)) {
      root.style.setProperty("--rv-radius-md", `${radiusVal * 0.75}${unit}`);
      root.style.setProperty("--rv-radius-sm", `${radiusVal * 0.5}${unit}`);
    }

  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {!mounted ? (
        <div style={{ visibility: "hidden", minHeight: "100vh" }}>{children}</div>
      ) : (
        children
      )}
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
