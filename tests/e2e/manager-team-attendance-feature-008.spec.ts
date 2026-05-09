import { expect, test } from "@playwright/test";

/**
 * Feature 008 — manager snapshot of direct reports’ punches today.
 *
 * Mint JWT after `npm run db:seed:predictive` with manager role and stable demo manager id:
 *
 * DEV_TENANT_ID=default-tenant \
 * DEV_ROLES=manager \
 * DEV_SUBJECT_EMPLOYEE_ID=b0000001-0001-4000-8000-000000000020 \
 * node scripts/issue-dev-jwt.mjs
 *
 * HR_ERP_MANAGER_TEAM_E2E_JWT=<token> npm run test:e2e -- tests/e2e/manager-team-attendance-feature-008.spec.ts
 */
test.describe("Feature 008 manager team attendance today", () => {
  test("home → Team attendance shows roster or empty-direct-reports card", async ({ page }) => {
    const jwt = process.env.HR_ERP_MANAGER_TEAM_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_MANAGER_TEAM_E2E_JWT (manager role + demo manager subject id)");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^Team attendance$/ }).click();
    await expect(page.getByRole("heading", { name: /^Team attendance today$/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Loading team attendance/)).toBeHidden({ timeout: 30_000 });
    await expect(
      page
        .getByRole("heading", { name: /^No direct reports$/ })
        .or(page.getByRole("heading", { name: /Jordan|Sam|Jordy|Taylor|Chen|Rivera/i })),
    ).toBeVisible({ timeout: 30_000 });
    expect(Date.now() - start).toBeLessThan(60_000);
  });
});
