"use client"

/**
 * Unified theme proxy — reads the active theme name from ThemeProvider
 * and returns the correct per-theme component implementations.
 */
import { useTheme } from "@/components/theme-provider/ThemeProvider"

// Vivid
import { VividButton } from "./vivid/Button"
import { VividCard } from "./vivid/Card"
import { VividInput } from "./vivid/Input"

// Monochrome
import { MonochromeButton } from "./monochrome/Button"
import { MonochromeCard } from "./monochrome/Card"
import { MonochromeInput } from "./monochrome/Input"

// Bauhaus
import { BauhausButton } from "./bauhaus/Button"
import { BauhausCard } from "./bauhaus/Card"
import { BauhausInput } from "./bauhaus/Input"

// Linear
import { LinearButton } from "./linear/Button"
import { LinearCard } from "./linear/Card"
import { LinearInput } from "./linear/Input"

export function useThemeComponents() {
  const { theme } = useTheme()
  switch (theme.name) {
    case "monochrome":
      return { ThemeButton: MonochromeButton, ThemeCard: MonochromeCard, ThemeInput: MonochromeInput }
    case "bauhaus":
      return { ThemeButton: BauhausButton, ThemeCard: BauhausCard, ThemeInput: BauhausInput }
    case "linear":
      return { ThemeButton: LinearButton, ThemeCard: LinearCard, ThemeInput: LinearInput }
    default: // vivid
      return { ThemeButton: VividButton, ThemeCard: VividCard, ThemeInput: VividInput }
  }
}

// Static re-exports for components that read theme internally (legacy usage)
export { VividButton, VividCard, VividInput }
export { MonochromeButton, MonochromeCard, MonochromeInput }
export { BauhausButton, BauhausCard, BauhausInput }
export { LinearButton, LinearCard, LinearInput }
