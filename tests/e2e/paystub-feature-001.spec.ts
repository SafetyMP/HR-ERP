import { expect, test } from "@playwright/test";

/**
 * Feature 001 UAC 6 — timed path (excludes network outside app control).
 * Generate JWT after `npm run demo:bootstrap` (or `db:seed:predictive`):
 *
 * DEV_TENANT_ID=default-tenant \
 * DEV_ROLES=employee \
 * DEV_SUBJECT_EMPLOYEE_ID=b0000001-0001-4000-8000-000000000011 \
 * node scripts/issue-dev-jwt.mjs
 *
 * Then: HR_ERP_PAYSTUB_E2E_JWT=<token> npm run test:e2e -- tests/e2e/paystub-feature-001.spec.ts
 */
test.describe("Feature 001 employee paystub", () => {
  test("home → earnings statement loads within 10s with session token", async ({ page }) => {
    const jwt = process.env.HR_ERP_PAYSTUB_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_PAYSTUB_E2E_JWT to run timed paystub UAC");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^Paystub$/ }).click();
    await expect(page.getByRole("heading", { name: /current earnings statement/i })).toBeVisible({
      timeout: 15_000,
    });
    expect(Date.now() - start).toBeLessThan(10_000);
  });
});
