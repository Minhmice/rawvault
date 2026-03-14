"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export type MonochromeInputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * MONOCHROME Input animation personality:
 *  - Focus: border-bottom JUMPS from 2px → 4px with zero easing (steps(1))
 *  - No ring, no glow — just a thicker line as mechanical acknowledgment
 *  - Typography: uppercase, mono, tracking-widest to reinforce editorial feel
 */
const MonochromeInput = React.forwardRef<HTMLInputElement, MonochromeInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full bg-transparent px-0 py-2 text-sm text-foreground",
          "border-0 border-b-2 border-foreground",
          "outline-none ring-0",
          "font-mono uppercase tracking-widest",
          "placeholder:uppercase placeholder:tracking-widest placeholder:text-xs placeholder:text-muted-foreground",
          // Border-bottom jumps width — steps(1) = instant, no tween
          "[transition:border-bottom-width_60ms_steps(1)]",
          "focus:border-b-[4px]",
          className
        )}
        {...props}
      />
    )
  }
)
MonochromeInput.displayName = "MonochromeInput"

export { MonochromeInput }
