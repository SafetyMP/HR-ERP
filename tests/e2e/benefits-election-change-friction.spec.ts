import { expect, test } from "@playwright/test";

import { elapsedMs, essE2eJwt, seedEssSession } from "./helpers/ess-friction";

/**
 * Feature 026 friction budget — open form → submit confirmation ≤45s.
 * See docs/product/ess-friction-scorecard.md row 6.
 */
test.describe("Feature 026 election change friction", () => {
  test.beforeEach(async ({ page }) => {
    const jwt = essE2eJwt();
    test.skip(!jwt, "Set HR_ERP_ESS_E2E_JWT (demo employee JWT) to run election change friction");
    await seedEssSession(page, jwt!);
  });

  test("benefits → election change → submit confirmation ≤45s", async ({ page }) => {
    const start = Date.now();
    await page.goto("/employee/benefits");
    await page.getByRole("link", { name: /request election change/i }).click();
    await expect(page.getByRole("heading", { name: /election change intent/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.locator("#ben-sum").fill("Switch medical tier from Silver to Gold for open enrollment.");
    await page.getByRole("button", { name: /submit intent/i }).click();
    await expect(page.getByText(/recorded|request/i)).toBeVisible({ timeout: 15_000 });
    expect(elapsedMs(start)).toBeLessThan(45_000);
  });
});
