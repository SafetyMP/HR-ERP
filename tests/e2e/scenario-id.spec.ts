import { expect, test } from "@playwright/test";

test.describe("QA lab scenario correlation", () => {
  test("surfaces scenarioId query param for shared fixture IDs", async ({ page }) => {
    const scenarioId = "e2e_parallel_pto_smoke";
    await page.goto(`/qa-lab?scenarioId=${encodeURIComponent(scenarioId)}`);
    await expect(page.getByTestId("scenario-label")).toHaveText(scenarioId);
    await expect(page.locator("[data-qa-scenario]")).toHaveAttribute("data-qa-scenario", scenarioId);
  });
});
