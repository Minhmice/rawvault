"use client"
import * as React from "react"
import { Card } from "@/components/theme/shadcn/card"
import { cn } from "@/lib/utils"

export interface VividCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

/**
 * VIVID Card animation personality:
 *  - Hover: float up (-6px Y) with glowing shadow bloom
 *  - Shadow transitions smoothly over 350ms cubic spring
 *  - Subtle scale-up (1.01) for depth
 */
const VividCard = React.forwardRef<HTMLDivElement, VividCardProps>(
  ({ className, glass, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          // Float + shadow bloom — springy cubic
          "[transition:transform_350ms_cubic-bezier(0.34,1.56,0.64,1),box-shadow_350ms_ease-out,border-color_200ms_ease]",
          "hover:-translate-y-[6px] hover:scale-[1.01]",
          "hover:shadow-[0_16px_40px_-8px_var(--rv-primary,hsl(var(--primary)))/25]",
          "hover:border-primary/40",
          "cursor-pointer",
          "animate-enter",
          glass ? "glass" : "",
          className
        )}
        {...props}
      />
    )
  }
)
VividCard.displayName = "VividCard"

export { VividCard }
