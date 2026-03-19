"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { SurfaceName } from "@/lib/theme/surfaces";
import { useSurface } from "@/components/app/SurfaceBoundary";
import { useTheme } from "@/components/theme-provider/ThemeProvider";

export type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  surface?: SurfaceName;
};

export function PageHeader({ title, subtitle, actions, className, surface }: PageHeaderProps) {
  const { surface: ctxSurface } = useSurface();
  const s = surface ?? ctxSurface;
  const { density } = useTheme();

  return (
    <div
      className={cn(
        "flex w-full flex-col justify-between sm:flex-row sm:items-start",
        density === "compact" ? "gap-3" : "gap-4",
        s === "marketing" && "pb-2",
        s === "auth" && "text-center sm:text-left",
        className
      )}
    >
      <div className="min-w-0">
        <div className="min-w-0 text-foreground">{title}</div>
        {subtitle ? (
          <div className={cn("text-sm text-muted-foreground", density === "compact" ? "mt-0.5" : "mt-1")}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

