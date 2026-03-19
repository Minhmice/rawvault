"use client";

import * as React from "react";
import { DialogContent } from "@/components/theme/shadcn/dialog";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider/ThemeProvider";

const APP_DIALOG_CONTENT_CLASS =
  "sm:max-w-md bg-popover text-popover-foreground border border-border";

export type AppDialogContentProps = React.ComponentProps<typeof DialogContent>;

export function AppDialogContent({
  className,
  ...props
}: AppDialogContentProps) {
  const { density, radiusMode } = useTheme();
  const densityClass = density === "compact" ? "p-3 gap-3" : "";
  const radiusClass =
    radiusMode === "rounded"
      ? "rounded-[calc(var(--radius)+12px)]"
      : radiusMode === "sharp"
        ? "rounded-[calc(var(--radius)*0.6)]"
        : "";

  return (
    <DialogContent
      className={cn(APP_DIALOG_CONTENT_CLASS, densityClass, radiusClass, className)}
      {...props}
    />
  );
}
