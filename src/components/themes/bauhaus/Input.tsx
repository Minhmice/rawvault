"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export type BauhausInputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * BAUHAUS Input animation personality:
 *  - Focus: border-color JUMPS to theme primary — steps(1), 80ms
 *  - AND a hard 2px drop-shadow appears simultaneously
 *  - Bold uppercase mono type — functional, zero-decoration
 *  - No ring, no blur — just a red mechanical acknowledgment
 */
const BauhausInput = React.forwardRef<HTMLInputElement, BauhausInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full px-3 py-2 text-sm text-rv-text bg-rv-surface",
          "border-2 border-rv-text",
          "rounded-none outline-none ring-0",
          "font-bold uppercase tracking-wider",
          "placeholder:uppercase placeholder:tracking-wider placeholder:text-xs placeholder:text-rv-text-muted",
          // Hard mechanical focus — color snaps, shadow appears
          "[transition:border-color_80ms_steps(1),box-shadow_80ms_steps(1)]",
          "focus:border-rv-primary focus:shadow-[2px_2px_0px_0px_var(--rv-primary)]",
          "hover:shadow-[2px_2px_0px_0px_var(--rv-border)]",
          className
        )}
        {...props}
      />
    )
  }
)
BauhausInput.displayName = "BauhausInput"

export { BauhausInput }
