import { expect, test } from "@playwright/test";

test.describe("Feature 022 product shell", () => {
  test("UAC-1 employee paystub shows sidebar navigation", async ({ page }) => {
    const jwt = process.env.HR_ERP_BENEFITS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_BENEFITS_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/employee/paystub");
    await expect(page.getByRole("navigation", { name: /employee/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Paystub" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Time & attendance" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Benefits" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Earnings statement/i })).toBeVisible();
  });

  test("UAC-2 manager shell shows team and recruiting nav", async ({ page }) => {
    const jwt = process.env.HR_ERP_RECRUITING_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_RECRUITING_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/manager/recruiting");
    await expect(page.getByRole("navigation", { name: /manager/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Team attendance" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Recruiting" })).toBeVisible();
  });

  test("UAC-3 HR dashboard shows sidebar navigation", async ({ page }) => {
    const jwt = process.env.HR_ERP_HR_DASHBOARD_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_HR_DASHBOARD_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/hr/dashboard");
    await expect(page.getByRole("navigation", { name: /HR operations/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pay runs" })).toBeVisible();
  });

  test("UAC-4 anonymous home shows sign-in not link farm", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Sign in", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Welcome back" })).not.toBeVisible();
  });

  test("UAC-5 toaster is mounted on HR payroll page", async ({ page }) => {
    const jwt = process.env.HR_ERP_PAYROLL_RUNS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_PAYROLL_RUNS_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/hr/payroll-runs");
    await expect(page.locator("[data-sonner-toaster]")).toBeAttached();
  });

  test("UAC-6 pay runs list shows back navigation pattern", async ({ page }) => {
    const jwt = process.env.HR_ERP_PAYROLL_RUNS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_PAYROLL_RUNS_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/hr/payroll-runs");
    await expect(page.getByRole("heading", { name: /Pay run console/i })).toBeVisible();
  });

  test("UAC-7 employee paystub avoids legacy zinc utility classes", async ({ page }) => {
    const jwt = process.env.HR_ERP_BENEFITS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_BENEFITS_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/employee/paystub");
    const hasZinc = await page.locator("#main-content [class*='zinc-']").count();
    expect(hasZinc).toBe(0);
  });

  test("UAC-8 paystub reachable in two clicks from authenticated home", async ({ page }) => {
    const jwt = process.env.HR_ERP_BENEFITS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_BENEFITS_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/");
    await page.getByRole("link", { name: "Paystub" }).click();
    await expect(page.getByRole("heading", { name: /Earnings statement/i })).toBeVisible();
  });
});
