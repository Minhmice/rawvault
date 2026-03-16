"use client";

import { useState, useEffect } from "react";
import { X, Palette, LayoutTemplate, Sparkles, Monitor, Moon } from "lucide-react";
import type { MessageKey } from "@/lib/i18n/messages";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useTheme, type ThemeName } from "../theme-provider/ThemeProvider";

// ─── Per-theme accent color palettes ─────────────────────────────────────────
const ACCENT_PALETTES: Record<ThemeName, { name: string; value: string; key: MessageKey }[]> = {
  vivid: [
    { name: "Blue",    value: "#3b82f6", key: "theme.accBlue" },
    { name: "Violet",  value: "#8b5cf6", key: "theme.accViolet" },
    { name: "Rose",    value: "#f43f5e", key: "theme.accRose" },
    { name: "Emerald", value: "#10b981", key: "theme.accEmerald" },
    { name: "Amber",   value: "#f59e0b", key: "theme.accAmber" },
    { name: "Slate",   value: "#64748b", key: "theme.accSlate" },
  ],
  monochrome: [
    { name: "Black",    value: "#000000", key: "theme.accBlack" },
    { name: "Charcoal", value: "#333333", key: "theme.accCharcoal" },
    { name: "Graphite", value: "#555555", key: "theme.accGraphite" },
  ],
  bauhaus: [
    { name: "Red",    value: "#D02020", key: "theme.accRed" },
    { name: "Blue",   value: "#1040C0", key: "theme.accBlue" },
    { name: "Yellow", value: "#F0C020", key: "theme.accYellow" },
    { name: "Black",  value: "#121212", key: "theme.accBlack" },
  ],
  linear: [
    { name: "Indigo",  value: "#5E6AD2", key: "theme.accIndigo" },
    { name: "Cyan",    value: "#22D3EE", key: "theme.accCyan" },
    { name: "Magenta", value: "#D946EF", key: "theme.accMagenta" },
    { name: "Violet",  value: "#8B5CF6", key: "theme.accViolet" },
  ],
};

// ─── Preset card definitions ─────────────────────────────────────────────────
const THEME_CARDS: {
  name: ThemeName;
  labelKey: MessageKey;
  subtitleKey: MessageKey;
  swatches: string[];
}[] = [
  { name: "vivid",     labelKey: "theme.vivid",     subtitleKey: "theme.vividSubtitle",     swatches: ["#3b82f6", "#8b5cf6", "#f43f5e"] },
  { name: "monochrome", labelKey: "theme.monochrome", subtitleKey: "theme.monochromeSubtitle", swatches: ["#000000", "#555555", "#ffffff"] },
  { name: "bauhaus",   labelKey: "theme.bauhaus",   subtitleKey: "theme.bauhausSubtitle",   swatches: ["#D02020", "#1040C0", "#F0C020"] },
  { name: "linear",    labelKey: "theme.linear",    subtitleKey: "theme.linearSubtitle",    swatches: ["#5E6AD2", "#22D3EE", "#8B5CF6"] },
];

export function ThemePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLocale();
  const { theme, setTheme, applyPreset } = useTheme();

  const palette = ACCENT_PALETTES[theme.name] ?? ACCENT_PALETTES.vivid;
  const borderRadius = typeof theme.borderRadius === "number" ? theme.borderRadius : 12;

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-theme-panel", handleToggle);
    return () => window.removeEventListener("toggle-theme-panel", handleToggle);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Palette className="h-5 w-5 text-primary" />
            {t("theme.workspaceTheme")}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("theme.closePanel")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-7">

          {/* ── Appearance ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <LayoutTemplate className="h-3.5 w-3.5" />
              {t("theme.appearance")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme({ mode: "light" })}
                className={`flex items-center justify-center gap-2 h-9 px-3 text-sm font-medium border rounded transition-all
                  ${theme.mode === "light"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground/40"}`}
              >
                <Monitor className="h-4 w-4" />
                {t("theme.light")}
              </button>
              <button
                onClick={() => setTheme({ mode: "dark" })}
                className={`flex items-center justify-center gap-2 h-9 px-3 text-sm font-medium border rounded transition-all
                  ${theme.mode === "dark"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground/40"}`}
              >
                <Moon className="h-4 w-4" />
                {t("theme.dark")}
              </button>
            </div>
          </div>

          {/* ── Accent Color ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Palette className="h-3.5 w-3.5" />
              {t("theme.accentColor")}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {palette.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setTheme({ primaryColor: c.value })}
                  className={`flex flex-col items-center gap-2 p-2 border rounded transition-all text-xs font-medium
                    ${theme.primaryColor === c.value
                      ? "border-foreground shadow-sm"
                      : "border-border hover:border-foreground/40"}`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-black/10"
                    style={{ backgroundColor: c.value }}
                  />
                  <span className="text-muted-foreground">{t(c.key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Border Radius — SLIDER ── */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {t("theme.borderRadius")}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("theme.sharp")}</span>
                <span
                  className="rounded px-1.5 py-0.5 border border-border text-foreground font-mono"
                  style={{ borderRadius: `${borderRadius}px` }}
                >
                  {borderRadius}px
                </span>
                <span>{t("theme.rounded")}</span>
              </div>
              <input
                type="range"
                min={0}
                max={theme.name === "vivid" ? 24 : 16}
                step={1}
                value={borderRadius}
                onChange={(e) => setTheme({ borderRadius: Number(e.target.value) })}
                className="w-full accent-foreground cursor-pointer"
              />
            </div>
          </div>

          {/* ── Design Systems ── */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {t("theme.designSystems")}
            </h3>
            <div className="space-y-2">
              {THEME_CARDS.map((tc) => {
                const isActive = theme.name === tc.name;
                return (
                  <button
                    key={tc.name}
                    onClick={() => applyPreset(tc.name as ThemeName)}
                    className={`w-full flex items-center justify-between p-4 border transition-all text-left
                      ${isActive
                        ? "border-foreground bg-foreground/5 shadow-sm"
                        : "border-border hover:border-foreground/40"}`}
                    style={{ borderRadius: `${borderRadius}px` }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">{t(tc.labelKey)}</span>
                      <span className="text-xs text-muted-foreground">{t(tc.subtitleKey)}</span>
                    </div>
                    <div className="flex gap-1">
                      {tc.swatches.map((color) => (
                        <div
                          key={color}
                          className="w-5 h-5 rounded-full border border-black/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border p-4">
          <button
            onClick={() => applyPreset("vivid")}
            className="w-full h-9 text-sm font-medium border border-border bg-muted/30 text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ borderRadius: `${borderRadius}px` }}
          >
            {t("theme.resetToDefault")}
          </button>
        </div>
      </aside>
    </>
  );
}
