"use client";

import * as React from "react";
import { useThemeComponents } from "@/components/themes";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider/ThemeProvider";

export type AppCardProps = React.HTMLAttributes<HTMLDivElement> & {
  glass?: boolean;
  size?: "default" | "sm";
};

export const AppCard = React.forwardRef<HTMLDivElement, AppCardProps>(function AppCard(props, ref) {
  const { ThemeCard } = useThemeComponents();
  const { density, radiusMode } = useTheme();
  const { className, size, ...rest } = props;

  const nextSize = size ?? (density === "compact" ? "sm" : "default");
  const radiusClass =
    radiusMode === "rounded"
      ? "rounded-[calc(var(--radius)+10px)]"
      : radiusMode === "sharp"
        ? "rounded-[calc(var(--radius)*0.6)]"
        : "";

  return (
    <ThemeCard
      ref={ref}
      data-size={nextSize === "sm" ? "sm" : undefined}
      className={cn(radiusClass, className)}
      {...rest}
    />
  );
});

