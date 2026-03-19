"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { SurfaceName } from "@/lib/theme/surfaces";
import { useSurface } from "@/components/app/SurfaceBoundary";
import { useTheme } from "@/components/theme-provider/ThemeProvider";

export type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  surface?: SurfaceName;
};

export function PageShell({ children, className, surface }: PageShellProps) {
  const { surface: ctxSurface } = useSurface();
  const s = surface ?? ctxSurface;
  const { density } = useTheme();

  const surfaceDefaults =
    density === "compact"
      ? s === "auth"
        ? "max-w-md py-7 sm:py-9"
        : s === "marketing"
          ? "max-w-5xl py-8 sm:py-10"
          : s === "admin"
            ? "max-w-7xl py-5 sm:py-6"
            : "max-w-6xl py-5 sm:py-6"
      : s === "auth"
        ? "max-w-md py-10 sm:py-12"
        : s === "marketing"
          ? "max-w-5xl py-10 sm:py-14"
          : s === "admin"
            ? "max-w-7xl py-6 sm:py-8"
            : "max-w-6xl py-6 sm:py-8";

  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", surfaceDefaults, className)}>
      {children}
    </div>
  );
}

