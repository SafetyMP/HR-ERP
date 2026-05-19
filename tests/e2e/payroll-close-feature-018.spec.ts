import { expect, test } from "@playwright/test";

test.describe("Feature 018 payroll close", () => {
  test("UAC-1 period detail shows status", async ({ page }) => {
    const jwt = process.env.HR_ERP_PAYROLL_RUNS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_PAYROLL_RUNS_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/hr/payroll-runs");
    const periodLink = page.getByRole("link").filter({ hasText: /\d{4}-\d{2}-\d{2}/ }).first();
    if ((await periodLink.count()) === 0) {
      test.skip(true, "No payroll periods in seed");
    }
    await periodLink.click();
    await expect(page.getByRole("heading", { name: /close checklist/i })).toBeVisible();
    await expect(page.getByText(/Status:/i).or(page.locator("[data-slot=badge]"))).toBeVisible();
  });
});
