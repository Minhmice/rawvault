import React from "react";
import { render as rtlRender, type RenderOptions } from "@testing-library/react";

function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function render(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
export { render };
