import { expect, test } from "@playwright/test";

test.describe("Feature 014 recruiting pipeline", () => {
  test("UAC-1 home → recruiting loads", async ({ page }) => {
    const jwt = process.env.HR_ERP_RECRUITING_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_RECRUITING_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/manager/recruiting");
    await expect(
      page.getByRole("heading", { name: /open roles/i }),
    ).toBeVisible();
  });
});
