import { expect, test } from "@playwright/test";

/**
 * Feature 010 — HR / payroll intake POST (`/employee/hr-request`).
 *
 * Requires running app + DB (creates a row). JWT must include `case:intake_submit`.
 *
 * HR_ERP_HR_CASE_E2E_JWT preferred; falls back to HR_ERP_PROFILE_E2E_JWT.
 */
test.describe("Feature 010 HR case intake", () => {
  test("home → HR request submits minimum-length note and shows confirmation", async ({
    page,
  }) => {
    const jwt =
      process.env.HR_ERP_HR_CASE_E2E_JWT?.trim() ??
      process.env.HR_ERP_PROFILE_E2E_JWT?.trim();
    test.skip(!jwt, "Set HR_ERP_HR_CASE_E2E_JWT or HR_ERP_PROFILE_E2E_JWT");

    await page.addInitScript((token: string) => {
      sessionStorage.setItem("hrerp_bearer_token", token);
    }, jwt);

    const start = Date.now();
    await page.goto("/employee/hr-request");
    await expect(
      page.getByRole("heading", { name: /^HR & payroll requests$/ }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: /^Message HR \/ Payroll$/ }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await page
      .locator("#case-body")
      .fill(
        "Automated HR intake note from Playwright — meets minimum length for validation.",
      );
    await page.getByRole("button", { name: /^Submit to HR$/ }).click();

    await expect(
      page.getByRole("status").filter({
        hasText: /Thanks — your note was logged for HR review/,
      }),
    ).toBeVisible({ timeout: 30_000 });
    expect(Date.now() - start).toBeLessThan(90_000);
  });
});
