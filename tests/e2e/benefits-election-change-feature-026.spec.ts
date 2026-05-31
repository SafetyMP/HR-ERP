import { expect, test } from "@playwright/test";

/**
 * Feature 026 UAC — in-app election change intent with confirmation.
 */
test.describe("Feature 026 benefits election change intent", () => {
  test("benefits summary links to election change and submit shows confirmation", async ({ page }) => {
    const jwt = process.env.HR_ERP_BENEFITS_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_BENEFITS_E2E_JWT to run Feature 026 UAC");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/employee/benefits");
    await expect(page.getByRole("link", { name: /request election change/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("link", { name: /request election change/i }).click();

    await expect(page.getByRole("heading", { name: /election change intent/i })).toBeVisible();
    await page.locator("#ben-sum").fill("Switch medical tier from Silver to Gold for open enrollment.");
    await page.getByRole("button", { name: /submit intent/i }).click();

    await expect(page.getByText(/recorded|request/i)).toBeVisible({ timeout: 15_000 });
  });
});
