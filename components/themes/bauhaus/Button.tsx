"use client"
import * as React from "react"
import { Button as ShadcnButton, buttonVariants } from "@/components/theme/shadcn/button"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export interface BauhausButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * BAUHAUS animation personality:
 *  - Physical press simulation via translate + shadow collapse
 *  - Hover: lifts UP (-2px Y) and shadow GROWS (4px → 6px)
 *  - Active/click: PRESSES DOWN (+2px X+Y) and shadow DISAPPEARS
 *  - Duration: 150ms ease-out — snappy, mechanical, zero bounciness
 *  - Each variant uses the matching Bauhaus primary color
 */
const BauhausButton = React.forwardRef<HTMLButtonElement, BauhausButtonProps>(
  ({ className, variant = "default", size, ...props }, ref) => {
    const bauhausBase = [
      "rounded-none border-2 border-rv-text",
      "font-bold uppercase tracking-wider text-xs",
      // Mechanical: 150ms ease-out, shadows change via transitions
      "shadow-[4px_4px_0px_0px_var(--rv-border)]",
      "[transition:transform_150ms_ease-out,box-shadow_150ms_ease-out,background-color_150ms_ease-out]",
      // Hover: lift up + shadow grows
      "hover:-translate-y-[2px] hover:shadow-[4px_6px_0px_0px_var(--rv-border)]",
      // Active: press down + shadow collapses — instant (50ms)
      "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:[transition-duration:50ms]",
      "animate-enter",
    ].join(" ")

    const variantMap: Record<string, string> = {
      default:     "bg-rv-primary text-white hover:bg-rv-primary-hover",
      secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/90",
      outline:     "bg-rv-surface text-rv-text hover:bg-rv-surface-muted",
      ghost:       "border-none shadow-none hover:shadow-none hover:bg-rv-surface-muted text-rv-text",
      destructive: "bg-rv-danger text-white hover:bg-rv-danger/90",
      link:        "border-none shadow-none hover:shadow-none text-secondary underline-offset-4 hover:underline",
    }

    const variantClass = variantMap[variant ?? "default"] ?? variantMap.default

    return (
      <ShadcnButton
        ref={ref}
        className={cn(bauhausBase, variantClass, className)}
        variant={variant}
        size={size}
        {...props}
      />
    )
  }
)
BauhausButton.displayName = "BauhausButton"

export { BauhausButton }
