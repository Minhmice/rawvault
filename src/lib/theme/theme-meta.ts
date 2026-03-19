import type { ThemeMode, ThemeName } from "./theme-values";

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

