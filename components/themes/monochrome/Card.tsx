"use client"
import * as React from "react"
import { Card } from "@/components/theme/shadcn/card"
import { cn } from "@/lib/utils"

export interface MonochromeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

/**
 * MONOCHROME Card — simplified.
 * Only the CARD SHELL inverts (border + bg).
 * Inner content uses `group-hover:` selectively in the consumer.
 * This prevents the wildcard `[&_*]` from blackening the preview area.
 */
const MonochromeCard = React.forwardRef<HTMLDivElement, MonochromeCardProps>(
  ({ className, glass: _glass, ...props }, ref) => {
    void _glass
    return (
      <Card
        ref={ref}
        className={cn(
          "rounded-none border-2 border-foreground shadow-none",
          // Only the card shell background flips — NO wildcard on children
          "[transition:border-color_60ms_steps(1)] group",
          "cursor-pointer",
          "animate-enter",
          className
        )}
        {...props}
      />
    )
  }
)
MonochromeCard.displayName = "MonochromeCard"

export { MonochromeCard }
