"use client"
import * as React from "react"
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/theme/shadcn/card"
import { useTheme } from "@/components/theme-provider/ThemeProvider"
import { cn } from "@/lib/utils"

export interface ThemeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

const ThemeCard = React.forwardRef<HTMLDivElement, ThemeCardProps>(
  ({ className, glass, ...props }, ref) => {
    const { themeName } = useTheme();
    const isMonochrome = themeName === "monochrome";

    const monochromeClasses = isMonochrome
      ? "rounded-none border-2 border-border shadow-none"
      : glass ? "glass" : "";

    return (
      <Card
        ref={ref}
        className={cn(monochromeClasses, className)}
        {...props}
      />
    )
  }
)
ThemeCard.displayName = "ThemeCard"

export {
  ThemeCard,
  CardHeader as ThemeCardHeader,
  CardFooter as ThemeCardFooter,
  CardTitle as ThemeCardTitle,
  CardDescription as ThemeCardDescription,
  CardContent as ThemeCardContent,
}
