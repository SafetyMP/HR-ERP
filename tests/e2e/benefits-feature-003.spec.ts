import { expect, test } from "@playwright/test";

/**
 * Feature 003 UAC — home → Benefits summary within task-time target (excluding external network).
 *
 * HR_ERP_BENEFITS_E2E_JWT — employee role includes `benefits:read`; set `subject_employee_id` + tenant to demo seed.
 */
test.describe("Feature 003 benefits enrollment summary", () => {
  test("home → Benefits loads enrollments within 45s with session token", async ({ page }) => {
    const jwt = process.env.HR_ERP_BENEFITS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_BENEFITS_E2E_JWT to run timed benefits UAC");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^Benefits$/ }).click();
    await expect(page.getByRole("heading", { name: /^Your enrollments$/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/PPO Gold|No enrollments on file/)).toBeVisible({ timeout: 30_000 });
    expect(Date.now() - start).toBeLessThan(45_000);
  });
});
