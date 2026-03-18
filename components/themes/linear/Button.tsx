"use client"
import * as React from "react"
import { Button } from "@/components/theme/shadcn/button"
import { cn } from "@/lib/utils"

export type LinearButtonProps = React.ComponentProps<typeof Button>

/**
 * LINEAR Button animation personality:
 *  - Premium interaction: expo-out easing (200-300ms)
 *  - Shadows: accent glow + top inset highlight
 *  - Active state: precise scale-down (0.98), reduced shadow
 *  - Shine effect: subtle gradient overlay on hover
 */
const LinearButton = React.forwardRef<HTMLButtonElement, LinearButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    
    // Linear specific base styles injected into the existing Shadcn button
    const linearClasses = cn(
      // Expo-out transition baseline
      "[transition:all_250ms_cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden",
      "active:scale-[0.98]",
      
      // Default/Primary variant overrides for Linear
      (!variant || variant === "default") && [
        "bg-rv-primary hover:bg-rv-primary-hover text-white border-none",
        "shadow-[0_0_0_1px_color-mix(in_oklab,var(--rv-primary),transparent_50%),0_4px_12px_color-mix(in_oklab,var(--rv-primary),transparent_70%),inset_0_1px_0_0_rgba(255,255,255,0.2)]",
        "hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--rv-primary-hover),transparent_40%),0_6px_16px_color-mix(in_oklab,var(--rv-primary),transparent_60%),inset_0_1px_0_0_rgba(255,255,255,0.3)]",
        "active:shadow-[0_0_0_1px_color-mix(in_oklab,var(--rv-primary),transparent_60%),0_2px_4px_color-mix(in_oklab,var(--rv-primary),transparent_80%),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
      ],

      // Outline/Secondary variant overrides for Linear
      (variant === "outline" || variant === "secondary") && [
        "bg-rv-surface-muted/40 hover:bg-rv-surface-muted/60 text-rv-text",
        "border border-rv-border/60 hover:border-rv-border",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
        "hover:shadow-[0_0_12px_rgba(255,255,255,0.05),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
      ],

      // Ghost variant overrides for Linear
      variant === "ghost" && [
        "hover:bg-rv-surface-muted/40 text-rv-text-muted hover:text-rv-text"
      ],
      
      "animate-enter",
      className
    )

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={linearClasses}
        {...props}
      />
    )
  }
)
LinearButton.displayName = "LinearButton"

export { LinearButton }
