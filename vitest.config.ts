import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/lib/test-setup.ts"],
    // Keep test discovery scoped to product tests only.
    // This avoids picking up tests from vendored worktrees (e.g. `.claude/worktrees/**`).
    include: [
      "./src/lib/**/*.test.{ts,tsx}",
      "./src/hooks/**/*.test.{ts,tsx}",
      "./src/components/**/*.test.{ts,tsx}",
    ],
    exclude: [
      "node_modules",
      ".next",
      "e2e",
      "skills",
      "scripts",
      ".sisyphus",
      ".cursor",
      ".claude",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
