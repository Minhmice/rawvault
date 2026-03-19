"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AppDialogActionsProps = React.HTMLAttributes<HTMLDivElement>;

export function AppDialogActions({
  className,
  ...props
}: AppDialogActionsProps) {
  return (
    <div
      className={cn("flex justify-end gap-2", className)}
      data-slot="app-dialog-actions"
      {...props}
    />
  );
}
