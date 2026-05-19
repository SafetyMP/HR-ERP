import { expect, test } from "@playwright/test";

test.describe("Feature 019 benefits life events", () => {
  test("UAC-1 employee life events page loads", async ({ page }) => {
    const jwt = process.env.HR_ERP_BENEFITS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_BENEFITS_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/employee/benefits/life-events");
    await expect(page.getByRole("heading", { name: /Life events/i })).toBeVisible();
  });

  test("UAC-2 HR life events queue loads", async ({ page }) => {
    const jwt = process.env.HR_ERP_HR_DASHBOARD_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_HR_DASHBOARD_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/hr/benefits/life-events");
    await expect(page.getByRole("heading", { name: /Life event queue/i })).toBeVisible();
  });
});
