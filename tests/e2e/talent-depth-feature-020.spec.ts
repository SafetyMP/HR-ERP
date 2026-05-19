import { expect, test } from "@playwright/test";

test.describe("Feature 020 talent depth", () => {
  test("UAC-1 pipeline shows interviews panel", async ({ page }) => {
    const jwt = process.env.HR_ERP_RECRUITING_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_RECRUITING_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/manager/recruiting");
    const reqLink = page
      .locator('a[href^="/manager/recruiting/requisitions/"]')
      .first();
    if ((await reqLink.count()) === 0) {
      test.skip(true, "No requisitions in seed");
    }
    await reqLink.click();
    await expect(page.getByText(/Interviews/i).first()).toBeVisible();
  });
});
