"use client";

import * as React from "react";
import { AppButton } from "@/components/app/AppButton";

export type AppIconButtonProps = Omit<React.ComponentProps<typeof AppButton>, "size"> & {
  size?: "icon" | "icon-xs" | "icon-sm" | "icon-lg";
};

/**
 * Icon-only buttons show up everywhere (toolbars, menus, copy actions).
 * This wrapper standardizes the safe defaults without forcing styling:
 * - defaults `type="button"` to avoid accidental form submits
 * - defaults `size="icon"` for consistent hit area
 */
export const AppIconButton = React.forwardRef<HTMLButtonElement, AppIconButtonProps>(
  function AppIconButton({ type, size = "icon", ...props }, ref) {
    return <AppButton ref={ref} type={type ?? "button"} size={size} {...props} />;
  }
);

