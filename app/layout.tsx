import "./globals.css";
import type { Metadata } from "next";
import { Inter, Outfit, Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider/ThemeProvider";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "RawVault - Workspace",
  description: "A digital workspace for RAW photographers",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} ${outfit.variable} antialiased font-sans`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
