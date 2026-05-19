import { expect, test } from "@playwright/test";

/**
 * Smoke navigation for Tier 1 competitive routes (014–017).
 * Requires HR_ERP_E2E_JWT or role-specific JWTs from ci-issue-e2e-jwts.mjs.
 */
test.describe("Competitive Tier 1 route smoke", () => {
  test("home exposes sign-in and role previews", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /HR ERP/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in with your organization account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Preview hub/i }).first()).toBeVisible();
  });
});
