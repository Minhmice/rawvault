"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export type VividInputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * VIVID Input animation personality:
 *  - Focus: animated ring EXPANDS from 0 → full width over 250ms
 *  - Uses box-shadow layering so ring "blooms" outward
 *  - Smooth cubic-bezier feel — organic, fluid
 */
const VividInput = React.forwardRef<HTMLInputElement, VividInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm",
          "placeholder:text-muted-foreground",
          "outline-none",
          // Ring bloom animation
          "[transition:box-shadow_250ms_cubic-bezier(0.34,1.56,0.64,1),border-color_200ms_ease]",
          "focus:border-primary",
          "focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary,hsl(var(--primary)))_25%,transparent)]",
          "hover:border-primary/60",
          className
        )}
        {...props}
      />
    )
  }
)
VividInput.displayName = "VividInput"

export { VividInput }
