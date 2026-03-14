"use client"
import * as React from "react"
import { Button as ShadcnButton, buttonVariants } from "@/components/theme/shadcn/button"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export interface VividButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * VIVID animation personality:
 *  - Smooth scale-up + subtle brightness lift
 *  - Duration: 300ms, cubic-bezier (springy)
 *  - Shadow blooms on hover
 */
const VividButton = React.forwardRef<HTMLButtonElement, VividButtonProps>(
  ({ className, variant = "default", size, style, ...props }, ref) => {
    return (
      <ShadcnButton
        ref={ref}
        className={cn(
          // Scale + shadow bloom — smooth cubic feel
          "transition-[transform,box-shadow,filter] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "hover:scale-[1.04] hover:brightness-105",
          variant === "default" && "hover:shadow-[0_6px_24px_0_var(--rv-primary)] hover:shadow-primary/30",
          "active:scale-[0.97] active:duration-75",
          "animate-enter",
          className
        )}
        variant={variant}
        size={size}
        style={style}
        {...props}
      />
    )
  }
)
VividButton.displayName = "VividButton"

export { VividButton }
