import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  // UI-only evidence: no session cookie, DB, real identity, or backend writes.
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: { authenticated: true } }),
  );
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      status: 503,
      json: { error: { message: "Synthetic service unavailable" } },
    }),
  );
});

test("employee destinations stay available with failed summaries and search supports the keyboard", async ({
  page,
}) => {
  await page.goto("/employee");
  const nav = page.getByRole("navigation", { name: "Employee navigation" });
  await expect(
    nav.getByRole("link", { name: "Contact HR", exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Time off", exact: true }),
  ).toBeVisible();
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: /Time off/i })
      .first(),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/navigation-redesign/app-employee.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Find a page", exact: true }).click();
  const search = page.getByRole("textbox", { name: "Search pages" });
  await expect(search).toBeFocused();
  await search.fill("vacation");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link")).toHaveCount(1);
  await search.press("ArrowDown");
  await expect(dialog.getByRole("link", { name: /Time off/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Find a page", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Find a page", exact: true }).click();
  await search.fill("no-matching-page");
  await expect(dialog.getByText("No matching pages")).toBeVisible();
  await dialog.getByRole("button", { name: "Show all pages" }).click();
  await expect(dialog.getByRole("link", { name: /Contact HR/ })).toBeVisible();
});

test("HR nested payroll retains one active parent and readable breadcrumbs", async ({
  page,
}) => {
  await page.goto("/hr/payroll-runs/synthetic-period");
  const nav = page.getByRole("navigation", {
    name: "HR operations navigation",
  });
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(
    nav.getByRole("link", { name: "Payroll runs", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(
    breadcrumb.getByRole("link", { name: "Payroll runs" }),
  ).toHaveAttribute("href", "/hr/payroll-runs");
  await expect(breadcrumb.getByText("Details", { exact: true })).toBeVisible();
  await expect(breadcrumb).not.toContainText("synthetic-period");
  await page.goto("/hr/dashboard");
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: /Benefit change requests/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/navigation-redesign/app-hr.png",
    fullPage: true,
  });
});

test("mobile drawer closes after navigation and Escape restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/employee");
  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await drawer
    .getByRole("link", { name: "Change benefits", exact: true })
    .click();
  await expect(page).toHaveURL(/\/employee\/benefits\/election-change$/);
  await expect(drawer).not.toBeVisible();
  await trigger.click();
  await expect(drawer.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(
    drawer.getByRole("link", { name: "Change benefits", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("ordinary workspace selection never changes demo identity", async ({
  page,
}) => {
  const bootstrapCalls: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/auth/demo-preview")
      bootstrapCalls.push(request.url());
  });
  await page.goto("/");
  const workspaces = page.getByRole("region", {
    name: "Workspaces",
    exact: true,
  });
  const hr = workspaces.getByRole("link", { name: /HR operations/ });
  await expect(hr).toHaveAttribute("href", "/hr/dashboard");
  await hr.click();
  await expect(page).toHaveURL(/\/hr\/dashboard$/);
  expect(bootstrapCalls).toEqual([]);
});
