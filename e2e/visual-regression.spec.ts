import { test, expect } from "@playwright/test";

const THEMES = [
  "vivid-light",
  "vivid-dark",
  "monochrome-light",
  "monochrome-dark",
  "bauhaus-light",
  "bauhaus-dark",
  "linear-light",
  "linear-dark",
] as const;

type ThemeValue = (typeof THEMES)[number];

async function applyThemeInitScript(
  context: import("@playwright/test").BrowserContext,
  theme: ThemeValue,
) {
  await context.addInitScript(
    (t) => {
      window.localStorage.setItem("theme", t);
    },
    theme,
  );
}

async function waitForLoginReady(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: "RawVault" })).toBeVisible({ timeout: 15_000 });
  const form = page.locator("form");
  await expect(form).toBeVisible({ timeout: 15_000 });
  await expect(form.locator("#signin-email")).toBeVisible({ timeout: 15_000 });
  await expect(form.locator("#signin-password")).toBeVisible({ timeout: 15_000 });
  await expect(
    form
      .getByRole("button", { name: /^Sign In$/i })
      .or(form.locator('button[type="submit"]')),
  ).toBeVisible({ timeout: 15_000 });
}

async function waitForVaultReady(page: import("@playwright/test").Page) {
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("main h1").first()).toBeVisible();
}

async function signInIfPossible(page: import("@playwright/test").Page) {
  const email = process.env.RAWVAULT_QA_EMAIL;
  const password = process.env.RAWVAULT_QA_PASSWORD;
  if (!email || !password) return false;

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await waitForLoginReady(page);
  const form = page.locator("form");
  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill(password);
  await form
    .getByRole("button", { name: /^Sign In$/i })
    .or(form.locator('button[type="submit"]'))
    .click();
  await page.waitForURL("**/");
  await waitForVaultReady(page);
  return true;
}

test.describe("visual-regression", () => {
  for (const theme of THEMES) {
    test.describe(`theme: ${theme}`, () => {
      test(`login looks correct`, async ({ page, context }, testInfo) => {
        await applyThemeInitScript(context, theme);

        await page.goto("/login", { waitUntil: "domcontentloaded" });
        await waitForLoginReady(page);

        const name = `${testInfo.project.name}-${theme}-login.png`;
        await expect(page).toHaveScreenshot(name, {
          fullPage: true,
          // WebKit/iOS rendering can be slightly nondeterministic (subpixel AA).
          // Keep strict on desktop, allow small drift on mobile only.
          maxDiffPixelRatio: testInfo.project.name === "mobile" ? 0.03 : 0,
        });
      });

      test(`vault looks correct (requires QA creds)`, async ({ page, context }, testInfo) => {
        await applyThemeInitScript(context, theme);

        const can = await signInIfPossible(page);
        test.skip(
          !can,
          "Set RAWVAULT_QA_EMAIL and RAWVAULT_QA_PASSWORD to enable Vault screenshots.",
        );

        await page.goto("/", { waitUntil: "domcontentloaded" });
        await waitForVaultReady(page);

        const name = `${testInfo.project.name}-${theme}-vault.png`;
        await expect(page).toHaveScreenshot(name, { fullPage: true });
      });
    });
  }
});

