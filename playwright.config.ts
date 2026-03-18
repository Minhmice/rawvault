import { defineConfig, devices } from "@playwright/test";

const isRealCI =
  process.env.GITHUB_ACTIONS === "true" ||
  process.env.BUILDKITE === "true" ||
  process.env.CIRCLECI === "true" ||
  process.env.GITLAB_CI === "true" ||
  process.env.TF_BUILD === "true" ||
  Boolean(process.env.JENKINS_URL);

export default defineConfig({
  testDir: "e2e",
  outputDir: "e2e/results",
  snapshotDir: "e2e/__screenshots__",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer:
      process.env.PLAYWRIGHT_REUSE_SERVER === "1" ? true : !isRealCI,
    timeout: 120_000,
  },
});
