import { expect, test } from "@playwright/test";

/**
 * Feature 005 UAC — home → PTO summary within task-time target (excluding external network).
 *
 * HR_ERP_PTO_E2E_JWT — employee role includes `pto:self_read`; set `subject_employee_id` + tenant to demo seed (Jordan).
 */
test.describe("Feature 005 PTO balance and recorded time off", () => {
  test("home → PTO loads balance and recorded dates within 60s with session token", async ({ page }) => {
    const jwt = process.env.HR_ERP_PTO_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_PTO_E2E_JWT to run timed PTO UAC");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^PTO$/ }).click();
    await expect(page.getByRole("heading", { name: /^Your PTO$/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: /^PTO balance$/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/\b40\b/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /^Recorded time off$/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("listitem")).toHaveCount(3);
    expect(Date.now() - start).toBeLessThan(60_000);
  });
});
