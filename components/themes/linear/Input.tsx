"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export type LinearInputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * LINEAR Input animation personality:
 *  - Background: deep surface, subtle border; transitions to theme primary on focus
 *  - Focus: Accent border + soft accent glow ring
 *  - Easing: standard linear expo-out 250ms
 */
const LinearInput = React.forwardRef<HTMLInputElement, LinearInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius)] px-3 py-2 text-sm",
          "bg-rv-surface-muted/40 text-rv-text",
          "border border-rv-border/60",
          "placeholder:text-rv-text-muted",
          "outline-none",
          "[transition:all_250ms_cubic-bezier(0.16,1,0.3,1)]",
          "hover:border-rv-border hover:bg-rv-surface-muted/60",
          "focus:border-rv-primary",
          "focus:shadow-[0_0_0_1px_color-mix(in_oklab,var(--rv-primary),transparent_50%),0_0_8px_color-mix(in_oklab,var(--rv-primary),transparent_75%)]",
          className
        )}
        {...props}
      />
    )
  }
)
LinearInput.displayName = "LinearInput"

export { LinearInput }
