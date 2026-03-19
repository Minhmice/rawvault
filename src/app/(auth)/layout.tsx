"use client";

import type { ReactNode } from "react";
import { SurfaceBoundary } from "@/components/app/SurfaceBoundary";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <SurfaceBoundary surface="auth">{children}</SurfaceBoundary>;
}

