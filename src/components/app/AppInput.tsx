"use client";

import * as React from "react";
import { useThemeComponents } from "@/components/themes";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider/ThemeProvider";

export type AppInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(function AppInput(props, ref) {
  const { ThemeInput } = useThemeComponents();
  const { density, radiusMode } = useTheme();
  const { className, ...rest } = props;

  const densityClass = density === "compact" ? "h-9 px-2.5 py-1.5 text-sm" : "";
  const radiusClass =
    radiusMode === "rounded"
      ? "rounded-[calc(var(--radius)+8px)]"
      : radiusMode === "sharp"
        ? "rounded-[calc(var(--radius)*0.6)]"
        : "";

  return <ThemeInput ref={ref} className={cn(densityClass, radiusClass, className)} {...rest} />;
});

