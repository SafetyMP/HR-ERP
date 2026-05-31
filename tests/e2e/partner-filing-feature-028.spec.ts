import { expect, test } from "@playwright/test";

/**
 * Feature 028 UAC — partner filing UX on period detail.
 */
test.describe("Feature 028 partner filing UX", () => {
  test("period detail shows partner filing handoff and counsel checklist link", async ({ page }) => {
    const jwt = process.env.HR_ERP_PAYROLL_RUNS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_PAYROLL_RUNS_E2E_JWT to run Feature 028 smoke");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/hr/payroll-runs");
    const periodLink = page.getByRole("link").filter({ hasText: /\d{4}-\d{2}-\d{2}/ }).first();
    if ((await periodLink.count()) === 0) {
      test.skip(true, "No payroll periods in seed");
    }
    await periodLink.click();
    await expect(page.getByRole("heading", { name: /period close checklist/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/partner filing handoff/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /counsel withholding checklist/i })).toBeVisible();
    const exportBtn = page.getByRole("button", { name: /export for partner/i });
    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });
});
