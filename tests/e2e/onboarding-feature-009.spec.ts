import { expect, test } from "@playwright/test";

/**
 * Feature 009 — onboarding checklist self-service.
 *
 * HR_ERP_ONBOARDING_E2E_JWT preferred; falls back to HR_ERP_PROFILE_E2E_JWT when JWT includes onboarding permissions.
 */
test.describe("Feature 009 onboarding checklist", () => {
  test("home → Onboarding shows checklist card", async ({ page }) => {
    const jwt =
      process.env.HR_ERP_ONBOARDING_E2E_JWT?.trim() ?? process.env.HR_ERP_PROFILE_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_ONBOARDING_E2E_JWT or HR_ERP_PROFILE_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^Onboarding$/ }).click();
    await expect(page.getByRole("heading", { name: /^Onboarding$/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /^Your checklist$/ })).toBeVisible({ timeout: 30_000 });
    expect(Date.now() - start).toBeLessThan(60_000);
  });
});
