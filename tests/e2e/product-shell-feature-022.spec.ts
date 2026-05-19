import { expect, test } from "@playwright/test";

test.describe("Feature 022 product shell", () => {
  test("employee paystub shows sidebar navigation", async ({ page }) => {
    const jwt = process.env.HR_ERP_BENEFITS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_BENEFITS_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/employee/paystub");
    await expect(page.getByRole("navigation", { name: /employee/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Paystub" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Earnings statement/i })).toBeVisible();
  });

  test("HR dashboard shows sidebar navigation", async ({ page }) => {
    const jwt = process.env.HR_ERP_HR_DASHBOARD_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_HR_DASHBOARD_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/hr/dashboard");
    await expect(page.getByRole("navigation", { name: /HR operations/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });
});
