import { expect, test } from "@playwright/test";

test.describe("Feature 017 employee learning", () => {
  test("UAC-1 home → my learning loads", async ({ page }) => {
    const jwt = process.env.HR_ERP_LEARNING_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_LEARNING_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    await page.goto("/employee/learning");
    await expect(
      page.getByRole("heading", { name: /my learning/i }),
    ).toBeVisible();
  });
});
