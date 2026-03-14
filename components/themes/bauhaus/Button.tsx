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
      "rounded-none border-2 border-[#121212]",
      "font-bold uppercase tracking-wider text-xs",
      // Mechanical: 150ms ease-out, shadows change via transitions
      "shadow-[4px_4px_0px_0px_#121212]",
      "[transition:transform_150ms_ease-out,box-shadow_150ms_ease-out,background-color_150ms_ease-out]",
      // Hover: lift up + shadow grows
      "hover:-translate-y-[2px] hover:shadow-[4px_6px_0px_0px_#121212]",
      // Active: press down + shadow collapses — instant (50ms)
      "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:[transition-duration:50ms]",
      "animate-enter",
    ].join(" ")

    const variantMap: Record<string, string> = {
      default:     "bg-[#D02020] text-white hover:bg-[#C01818]",
      secondary:   "bg-[#1040C0] text-white hover:bg-[#0D35A8]",
      outline:     "bg-white text-[#121212] hover:bg-[#F0F0F0]",
      ghost:       "border-none shadow-none hover:shadow-none hover:bg-[#E0E0E0] text-[#121212]",
      destructive: "bg-[#D02020] text-white hover:bg-[#C01818]",
      link:        "border-none shadow-none hover:shadow-none text-[#1040C0] underline-offset-4 hover:underline",
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
