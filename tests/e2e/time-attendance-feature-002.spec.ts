import { expect, test } from "@playwright/test";

/**
 * Feature 002 UAC 6 — confirm clock status within one minute (excluding external network).
 *
 * HR_ERP_TIME_E2E_JWT — same pattern as paystub (employee + subject_employee_id + tenant).
 */
test.describe("Feature 002 time and attendance", () => {
  test("home → Time summary loads within 60s with session token", async ({
    page,
  }) => {
    const jwt = process.env.HR_ERP_TIME_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_TIME_E2E_JWT to run timed attendance UAC");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^Time$/ }).click();
    await expect(
      page.getByRole("heading", { name: /^Time$/ }).first(),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page
        .getByText(
          /You’re clocked in|You’re not clocked in|No punches yet today/,
        )
        .first(),
    ).toBeVisible({ timeout: 30_000 });
    expect(Date.now() - start).toBeLessThan(60_000);
  });
});
