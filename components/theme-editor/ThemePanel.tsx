"use client";

import { useState, useEffect } from "react";
import { X, Palette, Type, LayoutTemplate } from "lucide-react";
import { useTheme } from "../theme-provider/ThemeProvider";
import { Button } from "../core/Button";

const colors = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Slate", value: "#64748b" },
];

const radii = [
  { name: "None", value: "0rem" },
  { name: "Small", value: "0.25rem" },
  { name: "Medium", value: "0.5rem" },
  { name: "Large", value: "0.75rem" },
  { name: "Full", value: "1rem" }, // In our system, 'Large' is base for cards
];

export function ThemePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-rv-surface border-l border-rv-border shadow-2xl z-50 flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-rv-border">
          <div className="flex items-center gap-2 font-semibold text-rv-text">
            <Palette className="h-5 w-5 text-rv-primary" />
            Workspace Theme
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full text-rv-text-muted hover:bg-rv-surface-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Mode */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-rv-text flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-rv-text-muted" />
              Appearance
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={theme.mode === "light" ? "primary" : "secondary"}
                onClick={() => setTheme({ mode: "light" })}
                className="justify-start px-3"
              >
                Light
              </Button>
              <Button 
                variant={theme.mode === "dark" ? "primary" : "secondary"}
                onClick={() => setTheme({ mode: "dark" })}
                className="justify-start px-3"
              >
                Dark
              </Button>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-rv-text flex items-center gap-2">
              <Palette className="h-4 w-4 text-rv-text-muted" />
              Accent Color
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setTheme({ primaryColor: c.value })}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-2 rounded-lg border
                    transition-all duration-200
                    ${theme.primaryColor === c.value ? "border-rv-primary bg-rv-primary/5" : "border-rv-border hover:border-rv-primary/50"}
                  `}
                >
                  <span 
                    className="h-6 w-6 rounded-full shadow-sm" 
                    style={{ backgroundColor: c.value }} 
                  />
                  <span className="text-xs font-medium text-rv-text-muted">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-rv-text flex items-center gap-2">
              <Type className="h-4 w-4 text-rv-text-muted" />
              Border Radius
            </h3>
            <div className="grid grid-cols-5 gap-1">
              {radii.map((r) => (
                <button
                  key={r.name}
                  onClick={() => setTheme({ borderRadius: r.value })}
                  className={`
                    h-10 text-xs font-medium border flex items-center justify-center transition-all
                    ${theme.borderRadius === r.value ? "border-rv-primary bg-rv-primary text-white" : "border-rv-border text-rv-text-muted hover:border-rv-primary/50"}
                  `}
                  style={{ borderRadius: r.value }}
                  title={r.name}
                >
                  {r.name.charAt(0)}
                </button>
              ))}
            </div>
            <p className="text-xs text-rv-text-muted mt-2">
              Adjusts the roundness of cards, buttons, and inputs globally.
            </p>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-rv-border bg-rv-surface-muted/50">
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => setTheme({ mode: "light", primaryColor: "#3b82f6", borderRadius: "1rem" })}
          >
            Reset to Default
          </Button>
        </div>
      </div>
    </>
  );
}
