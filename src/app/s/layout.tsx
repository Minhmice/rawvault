"use client";

import type { ReactNode } from "react";
import { SurfaceBoundary } from "@/components/app/SurfaceBoundary";

export default function ShareSurfaceLayout({ children }: { children: ReactNode }) {
  return <SurfaceBoundary surface="marketing">{children}</SurfaceBoundary>;
}

