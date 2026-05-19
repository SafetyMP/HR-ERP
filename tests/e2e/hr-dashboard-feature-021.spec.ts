import { expect, test } from "@playwright/test";

test.describe("Feature 021 HR dashboard", () => {
  test("UAC-1 dashboard loads headcount", async ({ page }) => {
    const jwt = process.env.HR_ERP_HR_DASHBOARD_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_HR_DASHBOARD_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/hr/dashboard");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/Headcount/i)).toBeVisible();
  });
});
