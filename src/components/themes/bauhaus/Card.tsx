"use client"
import * as React from "react"
import { Card } from "@/components/theme/shadcn/card"
import { cn } from "@/lib/utils"

export interface BauhausCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  accentColor?: "red" | "blue" | "yellow";
}

/**
 * BAUHAUS Card — physical press simulation.
 * Accent dot is positioned INSIDE the card (no overflow issues).
 * overflow-visible removed; dot uses inset positioning.
 */
const BauhausCard = React.forwardRef<HTMLDivElement, BauhausCardProps>(
  ({ className, glass: _glass, accentColor = "red", children, ...props }, ref) => {
    void _glass
    const dotColors: Record<NonNullable<BauhausCardProps["accentColor"]>, string> = {
      red: "var(--rv-danger)",
      blue: "var(--secondary)",
      yellow: "var(--accent)",
    }

    return (
      <Card
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-none border-4 border-border bg-card",
          // Lift + shadow grow
          "shadow-[4px_4px_0px_0px_var(--rv-border)]",
          "[transition:transform_150ms_ease-out,box-shadow_150ms_ease-out]",
          "hover:-translate-y-[3px] hover:shadow-[4px_8px_0px_0px_var(--rv-border)]",
          // Physical press
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none active:[transition-duration:50ms]",
          "group cursor-pointer",
          "animate-enter",
          className
        )}
        {...props}
      >
        {/* Accent dot — top-right INSIDE the card */}
        <div
          aria-hidden
          className="absolute top-3 right-3 w-3 h-3 rounded-full z-10 [transition:transform_150ms_ease-out] group-hover:scale-[1.5]"
          style={{ backgroundColor: dotColors[accentColor] }}
        />
        {children}
      </Card>
    )
  }
)
BauhausCard.displayName = "BauhausCard"

export { BauhausCard }
