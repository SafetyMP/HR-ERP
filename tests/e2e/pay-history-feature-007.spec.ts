import { expect, test } from "@playwright/test";

/**
 * Feature 007 — finalized period summaries (`/employee/paystub/history`).
 *
 * HR_ERP_PAYSTUB_E2E_JWT — employee JWT with `paystub:read` (same as Feature 001 demo subject works when seed includes prior period).
 */
test.describe("Feature 007 pay history summaries", () => {
  test("home → Pay history loads gross/net summary or empty state", async ({
    page,
  }) => {
    const jwt = process.env.HR_ERP_PAYSTUB_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_PAYSTUB_E2E_JWT to run pay history UAC");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    const start = Date.now();
    await page.goto("/employee/paystub/history");
    await expect(
      page.getByRole("heading", { name: /^Pay history$/ }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Loading pay history/)).toBeHidden({
      timeout: 30_000,
    });
    await expect(
      page
        .getByRole("heading", { name: /^No historical pay periods yet$/ })
        .or(page.getByText(/^Gross$/)),
    ).toBeVisible({ timeout: 30_000 });
    expect(Date.now() - start).toBeLessThan(60_000);
  });
});
