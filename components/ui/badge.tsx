import type { ReactNode } from "react";

type BadgeTone = "default" | "success" | "muted";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

const toneClassMap: Record<BadgeTone, string> = {
  default: "rv-badge",
  success: "rv-badge rv-badge-success",
  muted: "rv-badge rv-badge-muted",
};

export function Badge({ children, tone = "default" }: BadgeProps) {
  return <span className={toneClassMap[tone]}>{children}</span>;
}
