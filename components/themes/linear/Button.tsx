"use client"
import * as React from "react"
import { Button } from "@/components/theme/shadcn/button"
import { cn } from "@/lib/utils"

export interface LinearButtonProps extends React.ComponentProps<typeof Button> {}

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
        "bg-[#5E6AD2] hover:bg-[#6872D9] text-white border-none",
        "shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]",
        "hover:shadow-[0_0_0_1px_rgba(104,114,217,0.6),0_6px_16px_rgba(94,106,210,0.4),inset_0_1px_0_0_rgba(255,255,255,0.3)]",
        "active:shadow-[0_0_0_1px_rgba(94,106,210,0.4),0_2px_4px_rgba(94,106,210,0.2),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
      ],

      // Outline/Secondary variant overrides for Linear
      (variant === "outline" || variant === "secondary") && [
        "bg-white/[0.05] hover:bg-white/[0.08] text-[#EDEDEF]",
        "border border-white/10 hover:border-white/20",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
        "hover:shadow-[0_0_12px_rgba(255,255,255,0.05),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
      ],

      // Ghost variant overrides for Linear
      variant === "ghost" && [
        "hover:bg-white/[0.05] text-[#8A8F98] hover:text-[#EDEDEF]"
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
