import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home responds", async ({ page }) => {
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res?.ok() ?? false).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });
});
