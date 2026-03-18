"use client"
import * as React from "react"
import { Card } from "@/components/theme/shadcn/card"
import { cn } from "@/lib/utils"

export interface MonochromeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

/**
 * MONOCHROME Card — reference hover: light default → black surface, white type/icons.
 * Selected folder (data-selected) matches hover. Transitions via theme tokens (works in .dark too).
 */
const MonochromeCard = React.forwardRef<HTMLDivElement, MonochromeCardProps>(
  ({ className, glass: _glass, ...props }, ref) => {
    void _glass
    return (
      <Card
        ref={ref}
        className={cn(
          "rounded-none border-2 border-border bg-card text-card-foreground shadow-none",
          "cursor-pointer animate-enter group",
          "transition-colors duration-200",
          "hover:border-foreground hover:bg-foreground hover:text-background",
          "data-[selected=true]:border-foreground data-[selected=true]:bg-foreground data-[selected=true]:text-background",
          /* Titles & body copy (beat explicit text-foreground on children) */
          "hover:[&_h3]:!text-background data-[selected=true]:[&_h3]:!text-background",
          "hover:[&_p]:!text-background/85 data-[selected=true]:[&_p]:!text-background/85",
          /* All icons — beat text-blue-500 etc. on Lucide wrappers */
          "hover:[&_svg]:!text-background data-[selected=true]:[&_svg]:!text-background",
          /* Icon wells: bordered tile inverts */
          "hover:[&_[data-mono-icon]]:border-background/50 hover:[&_[data-mono-icon]]:bg-background/20 hover:[&_[data-mono-icon]]:text-background",
          "data-[selected=true]:[&_[data-mono-icon]]:border-background/50 data-[selected=true]:[&_[data-mono-icon]]:bg-background/20 data-[selected=true]:[&_[data-mono-icon]]:text-background",
          /* Muted labels / badges */
          "hover:[&_.text-muted-foreground]:!text-background/75 data-[selected=true]:[&_.text-muted-foreground]:!text-background/75",
          /* Preview status row (any status color → light) */
          "hover:[&_[data-mono-preview-status]]:!text-background/90 data-[selected=true]:[&_[data-mono-preview-status]]:!text-background/90",
          "hover:[&_.text-rv-success]:!text-background data-[selected=true]:[&_.text-rv-success]:!text-background",
          "hover:[&_.text-rv-danger]:!text-background data-[selected=true]:[&_.text-rv-danger]:!text-background",
          "hover:[&_.text-rv-warning]:!text-background data-[selected=true]:[&_.text-rv-warning]:!text-background",
          "hover:[&_.text-rv-file-image]:!text-background data-[selected=true]:[&_.text-rv-file-image]:!text-background",
          "hover:[&_.text-rv-file-video]:!text-background data-[selected=true]:[&_.text-rv-file-video]:!text-background",
          "hover:[&_.text-rv-file-doc]:!text-background data-[selected=true]:[&_.text-rv-file-doc]:!text-background",
          "hover:[&_.text-foreground]:!text-background data-[selected=true]:[&_.text-foreground]:!text-background",
          /* Card menu trigger */
          "hover:[&_[role=button]]:text-background data-[selected=true]:[&_[role=button]]:text-background",
          "hover:[&_[role=button]]:hover:bg-background/15 data-[selected=true]:[&_[role=button]]:hover:bg-background/15",
          className
        )}
        {...props}
      />
    )
  }
)
MonochromeCard.displayName = "MonochromeCard"

export { MonochromeCard }
