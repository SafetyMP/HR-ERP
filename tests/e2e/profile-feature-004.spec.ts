import { expect, test } from "@playwright/test";

/**
 * Feature 004 UAC 6 — returning user can review primary sections within 90s (excluding external network).
 *
 * HR_ERP_PROFILE_E2E_JWT — employee JWT with `employees:read` + `profile:self_update`.
 */
test.describe("Feature 004 employee profile self-service", () => {
  test("home → My profile sections visible within 90s", async ({ page }) => {
    const jwt = process.env.HR_ERP_PROFILE_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_PROFILE_E2E_JWT to run timed profile UAC");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^Paystub$/ }).click();
    await page.getByRole("link", { name: /^Profile$/ }).click();
    await expect(page.getByRole("heading", { name: /^My profile$/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: /^Identity & reachability$/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: /^Mailing address$/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: /^Emergency contact$/ })).toBeVisible({
      timeout: 30_000,
    });
    expect(Date.now() - start).toBeLessThan(90_000);
  });
});
