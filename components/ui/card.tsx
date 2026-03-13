import type { ReactNode } from "react";

type SharedProps = {
  children: ReactNode;
  className?: string;
};

function withClass(baseClass: string, className?: string) {
  return [baseClass, className].filter(Boolean).join(" ");
}

export function Card({ children, className }: SharedProps) {
  return <section className={withClass("rv-card", className)}>{children}</section>;
}

export function CardHeader({ children, className }: SharedProps) {
  return <header className={withClass("rv-card-header", className)}>{children}</header>;
}

export function CardTitle({ children, className }: SharedProps) {
  return <h2 className={withClass("rv-card-title", className)}>{children}</h2>;
}

export function CardDescription({ children, className }: SharedProps) {
  return <p className={withClass("rv-card-description", className)}>{children}</p>;
}

export function CardContent({ children, className }: SharedProps) {
  return <div className={withClass("rv-card-content", className)}>{children}</div>;
}
