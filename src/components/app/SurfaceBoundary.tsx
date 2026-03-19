"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { SurfaceName } from "@/lib/theme/surfaces";
import { DEFAULT_SURFACE } from "@/lib/theme/surfaces";

type SurfaceContextValue = {
  surface: SurfaceName;
};

const SurfaceContext = React.createContext<SurfaceContextValue | null>(null);

export function useSurface(): SurfaceContextValue {
  return React.useContext(SurfaceContext) ?? { surface: DEFAULT_SURFACE };
}

export type SurfaceBoundaryProps = {
  surface?: SurfaceName;
  className?: string;
  children: React.ReactNode;
};

export function SurfaceBoundary({ surface, className, children }: SurfaceBoundaryProps) {
  const value = React.useMemo<SurfaceContextValue>(
    () => ({ surface: surface ?? DEFAULT_SURFACE }),
    [surface]
  );

  return (
    <SurfaceContext.Provider value={value}>
      <div data-surface={value.surface} className={cn("min-h-0", className)}>
        {children}
      </div>
    </SurfaceContext.Provider>
  );
}

