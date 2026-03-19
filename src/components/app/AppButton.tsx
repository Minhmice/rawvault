"use client";

import * as React from "react";
import { useThemeComponents } from "@/components/themes";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/theme/shadcn/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider/ThemeProvider";

export type AppButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(function AppButton(props, ref) {
  const { ThemeButton } = useThemeComponents();
  const { density, radiusMode } = useTheme();
  const { className, size, ...rest } = props;

  const nextSize = size ?? (density === "compact" ? "sm" : undefined);
  const radiusClass =
    radiusMode === "rounded"
      ? "rounded-[calc(var(--radius)+8px)]"
      : radiusMode === "sharp"
        ? "rounded-[calc(var(--radius)*0.6)]"
        : "";

  return (
    <ThemeButton
      ref={ref}
      size={nextSize}
      className={cn(radiusClass, className)}
      {...rest}
    />
  );
});

