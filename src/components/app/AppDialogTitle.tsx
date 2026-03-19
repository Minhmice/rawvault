"use client";

import * as React from "react";
import { DialogTitle } from "@/components/theme/shadcn/dialog";
import { cn } from "@/lib/utils";

const APP_DIALOG_TITLE_CLASS =
  "font-heading font-bold uppercase tracking-widest";

export type AppDialogTitleProps = React.ComponentProps<typeof DialogTitle>;

export function AppDialogTitle({ className, ...props }: AppDialogTitleProps) {
  return (
    <DialogTitle
      className={cn(APP_DIALOG_TITLE_CLASS, className)}
      {...props}
    />
  );
}
