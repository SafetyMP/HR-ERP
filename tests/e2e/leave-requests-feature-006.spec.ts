import { expect, test } from "@playwright/test";

/**
 * Feature 006 — multi-day leave submission panel on `/employee/pto`.
 *
 * JWT must include `leave:self_submit` (employee role does). Use same demo subject as Feature 005 when possible:
 *
 * HR_ERP_LEAVE_E2E_JWT=<token> npm run test:e2e -- tests/e2e/leave-requests-feature-006.spec.ts
 *
 * Falls back to HR_ERP_PTO_E2E_JWT when HR_ERP_LEAVE_E2E_JWT is unset.
 */
test.describe("Feature 006 leave requests self-submit", () => {
  test("home → PTO shows request form and submitted requests list", async ({ page }) => {
    const jwt =
      process.env.HR_ERP_LEAVE_E2E_JWT?.trim() ?? process.env.HR_ERP_PTO_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_LEAVE_E2E_JWT or HR_ERP_PTO_E2E_JWT for leave UAC");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^PTO$/ }).click();
    await expect(page.getByRole("heading", { name: /^Your PTO$/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /^Request time off$/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /^Your submitted requests$/ })).toBeVisible({
      timeout: 30_000,
    });
    expect(Date.now() - start).toBeLessThan(60_000);
  });
});
