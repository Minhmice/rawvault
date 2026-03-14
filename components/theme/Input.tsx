"use client"
import * as React from "react"
import { Input as ShadcnInput } from "@/components/theme/shadcn/input"
import { useTheme } from "@/components/theme-provider/ThemeProvider"
import { cn } from "@/lib/utils"

export interface ThemeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const ThemeInput = React.forwardRef<HTMLInputElement, ThemeInputProps>(
  ({ className, error, ...props }, ref) => {
    const { theme } = useTheme();
    const isMonochrome = theme.name === "monochrome";

    const monochromeClasses = isMonochrome
      ? "rounded-none border-0 border-b-2 border-border bg-transparent px-0 py-2 shadow-none focus-visible:ring-0 focus-visible:border-b-4 focus-visible:border-foreground"
      : "";

    return (
      <div className="w-full">
        <ShadcnInput
          className={cn(monochromeClasses, className)}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
ThemeInput.displayName = "ThemeInput"

export { ThemeInput }
