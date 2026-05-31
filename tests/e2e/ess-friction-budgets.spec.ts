import { expect, test } from "@playwright/test";

import { elapsedMs, essE2eJwt, seedEssSession } from "./helpers/ess-friction";

/**
 * Top-5 ESS friction budgets — see docs/product/ess-friction-scorecard.md
 */
test.describe("ESS friction budgets (scorecard)", () => {
  test.beforeEach(async ({ page }) => {
    const jwt = essE2eJwt();
    test.skip(!jwt, "Set HR_ERP_ESS_E2E_JWT (demo employee JWT) to run ESS friction suite");
    await seedEssSession(page, jwt!);
  });

  test("paystub: home → earnings statement ≤10s", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /earnings statement/i }).click();
    await expect(page.getByRole("heading", { name: /current earnings statement/i })).toBeVisible({
      timeout: 15_000,
    });
    expect(elapsedMs(start)).toBeLessThan(10_000);
  });

  test("time: home → clock status ≤60s", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^Time$/ }).click();
    await expect(page.getByRole("heading", { name: /^Time$/ }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText(/You’re clocked in|You’re not clocked in|No punches yet today/),
    ).toBeVisible({ timeout: 30_000 });
    expect(elapsedMs(start)).toBeLessThan(60_000);
  });

  test("PTO: home → balance and recorded time off ≤60s", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^PTO$/ }).click();
    await expect(page.getByRole("heading", { name: /^Your PTO$/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: /^PTO balance$/ })).toBeVisible({ timeout: 30_000 });
    expect(elapsedMs(start)).toBeLessThan(60_000);
  });

  test("profile: home → primary sections ≤90s", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^My profile$/ }).click();
    await expect(page.getByRole("heading", { name: /^My profile$/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: /^Identity & reachability$/ })).toBeVisible({
      timeout: 30_000,
    });
    expect(elapsedMs(start)).toBeLessThan(90_000);
  });

  test("benefits: home → enrollments ≤45s", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.getByRole("link", { name: /^Benefits$/ }).click();
    await expect(page.getByRole("heading", { name: /^Your enrollments$/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/PPO Gold|No enrollments on file/)).toBeVisible({ timeout: 30_000 });
    expect(elapsedMs(start)).toBeLessThan(45_000);
  });
});
