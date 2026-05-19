import { expect, test } from "@playwright/test";

test.describe("Feature 016 payroll runs console", () => {
  test("UAC-1 home → pay runs loads", async ({ page }) => {
    const jwt = process.env.HR_ERP_PAYROLL_RUNS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_PAYROLL_RUNS_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/");
    await page.getByRole("link", { name: /payroll runs/i }).click();
    await expect(page.getByRole("heading", { name: /pay run console/i })).toBeVisible();
  });
});
