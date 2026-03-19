"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AppDialogErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

export function AppDialogError({
  className,
  ...props
}: AppDialogErrorProps) {
  return (
    <p
      className={cn("text-sm text-destructive", className)}
      role="alert"
      {...props}
    />
  );
}
