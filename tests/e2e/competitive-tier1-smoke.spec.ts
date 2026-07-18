import { expect, test } from "@playwright/test";

/**
 * Smoke navigation for Tier 1 competitive routes (014–017).
 * Requires HR_ERP_E2E_JWT or role-specific JWTs from ci-issue-e2e-jwts.mjs.
 */
test.describe("Competitive Tier 1 route smoke", () => {
  test("home exposes demo personas and developer preview links", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /HR ERP/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Start as employee/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Capability hub/i }),
    ).toBeVisible();
  });
});
