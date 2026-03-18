import "./globals.css";
import type { Metadata } from "next";
import {
  Inter,
  Outfit,
  Playfair_Display,
  Source_Serif_4,
  JetBrains_Mono,
  Manrope,
  Space_Grotesk,
} from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider/ThemeProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { TooltipProvider } from "@/components/theme/shadcn/tooltip";
import { ThemePanel } from "@/components/theme-editor/ThemePanel";
import type { ReactNode } from "react";

// Layout hierarchy: RootLayout → (providers) → LoadingScreen + children → overlays (ThemePanel).
// Dialogs (Share, Rename, Delete) portal to document.body from within page content.

// ── Vivid fonts ──────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

// ── Monochrome fonts ─────────────────────────────
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

// ── Bauhaus font ─────────────────────────────────
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "700"],
  display: "swap",
});

// ── RawVault HTML fonts ──────────────────────────
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RawVault - Workspace",
  description: "A digital workspace for RAW photographers",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fontVars = [
    inter.variable,
    outfit.variable,
    playfair.variable,
    sourceSerif.variable,
    jetbrainsMono.variable,
    spaceGrotesk.variable,
    manrope.variable,
  ].join(" ");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVars} antialiased`}>
        <ThemeProvider>
          <LocaleProvider>
            <TooltipProvider>
              <LoadingScreen />
              {children}
              <ThemePanel />
            </TooltipProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
