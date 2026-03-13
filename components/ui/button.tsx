import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "default" | "secondary" | "danger" | "link";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClassMap: Record<ButtonVariant, string> = {
  default: "rv-btn",
  secondary: "rv-btn rv-btn-secondary",
  danger: "rv-btn rv-btn-danger",
  link: "rv-btn rv-btn-link",
};

export function Button({ variant = "default", children, className, ...rest }: ButtonProps) {
  const classes = [variantClassMap[variant], className].filter(Boolean).join(" ");
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
