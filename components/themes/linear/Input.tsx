"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export interface LinearInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * LINEAR Input animation personality:
 *  - Background: near-black #0F0F12
 *  - Border: subtle 10% white, transitions to accent #5E6AD2
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
          "bg-[#0F0F12] text-gray-100",
          "border border-white/10",
          "placeholder:text-gray-500",
          "outline-none",
          "[transition:all_250ms_cubic-bezier(0.16,1,0.3,1)]",
          "hover:border-white/20 hover:bg-[#15151A]",
          "focus:border-[#5E6AD2]",
          "focus:shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_0_8px_rgba(94,106,210,0.25)]",
          className
        )}
        {...props}
      />
    )
  }
)
LinearInput.displayName = "LinearInput"

export { LinearInput }
