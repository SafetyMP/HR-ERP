import { expect, test } from "@playwright/test";

test.describe("Feature 015 performance review cycle", () => {
  test("UAC-1 employee home → performance goals loads", async ({ page }) => {
    const jwt = process.env.HR_ERP_PERFORMANCE_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_PERFORMANCE_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/employee/performance/goals");
    await expect(
      page.getByRole("heading", { name: /performance goals/i }),
    ).toBeVisible();
  });

  test("UAC-5 manager home → team performance goals loads", async ({
    page,
  }) => {
    const jwt = process.env.HR_ERP_MANAGER_PERF_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_MANAGER_PERF_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/manager/team-performance");
    await expect(
      page.getByRole("heading", { name: /team performance goals/i }),
    ).toBeVisible();
  });
});
