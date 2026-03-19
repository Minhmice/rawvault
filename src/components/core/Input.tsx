import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          flex h-10 w-full rounded-[var(--rv-radius-md)] border
          bg-transparent px-3 py-2 text-sm text-rv-text
          file:border-0 file:bg-transparent file:text-sm file:font-medium
          placeholder:text-rv-text-muted
          focus-visible:outline-none focus-visible:ring-2
          disabled:cursor-not-allowed disabled:opacity-50
          transition-colors duration-200
          ${error 
            ? "border-rv-danger focus-visible:ring-rv-danger/30" 
            : "border-rv-border focus-visible:ring-rv-primary/30"
          }
          ${className}
        `}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
