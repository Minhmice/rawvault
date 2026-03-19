"use client"
import * as React from "react"
import { Button as ShadcnButton, buttonVariants } from "@/components/theme/shadcn/button"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export interface MonochromeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * MONOCHROME animation personality:
 *  - Instant binary inversion (black ↔ white)
 *  - Duration: 80ms, steps(1) — zero easing, no in-between frames
 *  - No scale, no shadow — just a hard flip
 *  - Accent-less: single behavior regardless of variant
 */
const MonochromeButton = React.forwardRef<HTMLButtonElement, MonochromeButtonProps>(
  ({ className, variant = "default", size, ...props }, ref) => {
    const base = [
      "rounded-none",
      "uppercase tracking-widest font-medium text-xs",
      // Binary color inversion at 80ms with steps(1) — no smooth tween
      "[transition:background-color_80ms_steps(1),color_80ms_steps(1),border-color_80ms_steps(1)]",
      "border-2 border-foreground",
    ].join(" ")

    // All variants collapse to the same invert-on-hover mechanic
    const invert = "bg-background text-foreground hover:bg-foreground hover:text-background"
    const activeStyle = "active:opacity-70"

    return (
      <ShadcnButton
        ref={ref}
        className={cn(base, invert, activeStyle, "animate-enter", className)}
        variant={variant}
        size={size}
        {...props}
      />
    )
  }
)
MonochromeButton.displayName = "MonochromeButton"

export { MonochromeButton }
