"use client"
import * as React from "react"
import { Button as ShadcnButton, buttonVariants } from "@/components/theme/shadcn/button"
import { type VariantProps } from "class-variance-authority"
import { useTheme } from "@/components/theme-provider/ThemeProvider"
import { cn } from "@/lib/utils"

export interface ThemeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const ThemeButton = React.forwardRef<HTMLButtonElement, ThemeButtonProps>(
  ({ className, variant = "default", size, ...props }, ref) => {
    const { theme } = useTheme();
    const isMonochrome = theme.name === "monochrome";

    // Monochrome specific overrides
    const monochromeClasses = isMonochrome
      ? "rounded-none transition-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--foreground)] focus-visible:outline-offset-3 uppercase tracking-widest font-medium"
      : "transition-all duration-300";

    const variantOverrides = isMonochrome && variant === "default" 
      ? "bg-foreground text-background hover:bg-background hover:text-foreground border-2 border-transparent hover:border-foreground"
      : "";

    return (
      <ShadcnButton
        className={cn(monochromeClasses, variantOverrides, className)}
        variant={variant}
        size={size}
        ref={ref}
        {...props}
      />
    )
  }
)
ThemeButton.displayName = "ThemeButton"

export { ThemeButton, buttonVariants }
