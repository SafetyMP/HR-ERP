import { expect, test } from "@playwright/test";
import capture from "../../demo/app/leave-evidence.json";

const base = process.env.DEMO_BASE_PATH ?? "/HR-ERP";
const origin = process.env.DEMO_ORIGIN ?? "http://127.0.0.1:3109";
const home = base + "/";
const title = "Review Alex’s leave balance";
const inspector = "Trace the leave calculation";

test("the primary case loads from Pages, offers the original release choices and keeps a funded pilot separate", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin || url.pathname.includes("/api/"))
      errors.push(url.href);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(response.url());
  });
  await page.goto(home);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Employee leave statement" }),
  ).toBeVisible();
  await expect(page.locator(".case-balance")).toContainText("72");
  await page.screenshot({
    path: "artifacts/navigation-redesign/leave-release-desktop.png",
  });
  await page.getByRole("button", { name: "Sign off revision A" }).click();
  await expect(page.getByRole("status")).toContainText("unexamined states");
  await page.getByRole("radio", { name: "Pending" }).check();
  await expect(
    page.getByRole("row", { name: "Pending 80 h 72 h" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hold revision A" }).click();
  await expect(page.getByRole("status")).toContainText("reproducible finding");
  await expect(page.locator(".case-totals")).toContainText("-$150");
  const minutes = page.getByRole("slider", {
    name: /Minutes saved per change/,
  });
  await minutes.focus();
  await minutes.press("End");
  await expect(page.locator(".case-totals")).toContainText("$1,200");
  await page
    .getByRole("link", { name: "Inspect this balance calculation" })
    .click();
  await expect(page.getByRole("heading", { name: inspector })).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveValue("A-pending");
  await expect(page.locator(".trace-receipt")).toContainText(
    "8-hour shortfall",
  );
  await page.screenshot({
    path: "artifacts/navigation-redesign/leave-trace-desktop.png",
  });
  await page.getByRole("combobox").selectOption("B-pending");
  await expect(page.locator(".trace-receipt")).toContainText(
    "Different review conditions",
  );
  await expect(page.locator(".trace-stages")).toContainText("72 h displayed");
  await page
    .getByRole("link", { name: "Return to revision A · Pending" })
    .click();
  await expect(page.getByRole("status")).toContainText("reproducible finding");
  await expect(minutes).toHaveValue("60");
  await page.getByRole("radio", { name: "Revision B" }).check();
  await page.getByRole("radio", { name: "Declined" }).check();
  await page.getByRole("button", { name: "Sign off revision B" }).click();
  await expect(page.getByRole("status")).toContainText(
    "All three modeled balances match",
  );
  expect(errors).toEqual([]);
});

test("the six archived observations reconcile with the selected model; bookmarks preserve comparison and return", async ({
  page,
}) => {
  for (const run of capture.records) {
    await page.goto(
      home + "#/case?revision=" + run.revision + "&state=" + run.state,
    );
    await expect(page.getByRole("radio", { name: run.state })).toBeChecked();
    await expect(page.locator(".case-ledger dd strong")).toHaveText([
      run.openingHours + " h",
      run.expectedHours + " h",
      run.displayedHours + " h",
    ]);
    await page
      .getByRole("link", { name: "Inspect this balance calculation" })
      .click();
    await expect(page.getByRole("combobox")).toHaveValue(run.id);
    await expect(page.locator(".trace-receipt dd")).toHaveText([
      run.openingHours + " h",
      run.expectedHours + " h",
      run.displayedHours + " h",
    ]);
  }
  await page.getByRole("combobox").selectOption("A-declined");
  await page.reload();
  await expect(page.getByRole("combobox")).toHaveValue("A-declined");
  await expect(page.locator(".trace-stages")).toContainText("80 h displayed");
  await expect(page.locator(".trace-receipt")).toContainText(
    "Different review conditions",
  );
  await page
    .getByRole("link", { name: "Return to revision B · Declined" })
    .click();
  await expect(page.getByRole("radio", { name: "Revision B" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Declined" })).toBeChecked();
  await page.goBack();
  await expect(page.getByRole("combobox")).toHaveValue("A-declined");
});

test("history keeps recommendations with the reviewed revision, state and evidence set", async ({
  page,
}) => {
  await page.goto(home + "#/case?revision=A&state=Pending");
  await page.getByRole("radio", { name: "Revision B" }).check();
  await page.getByRole("button", { name: "Sign off revision B" }).click();
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Sign off revision A" }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("status")).toBeEmpty();
  await page.goForward();
  await expect(
    page.getByRole("button", { name: "Sign off revision B" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("radio", { name: "Revision A" }).check();
  await page.getByRole("radio", { name: "Declined" }).check();
  await expect(
    page.getByRole("row", { name: "Pending 80 h 72 h" }),
  ).toBeVisible();
});

test("phone opens both current views and retired workspace bookmarks resolve to the inspector", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(home);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.screenshot({
    path: "artifacts/navigation-redesign/leave-release-mobile.png",
  });
  const fits = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
  expect(await fits()).toBe(true);
  await page.getByRole("radio", { name: "Declined" }).check();
  await page
    .getByRole("link", { name: "Inspect this balance calculation" })
    .click();
  await expect(page.getByRole("combobox")).toHaveValue("A-declined");
  expect(await fits()).toBe(true);
  await page.screenshot({
    path: "artifacts/navigation-redesign/leave-trace-mobile.png",
  });
  for (const historical of [
    "#/employee/pto",
    "#/hr/review-queue",
    "#technical",
    "#/technical",
  ]) {
    await page.goto(home + historical);
    await expect(page.getByRole("heading", { name: inspector })).toBeVisible();
    await expect(
      page.locator('a[href^="#/employee"], a[href^="#/hr"]'),
    ).toHaveCount(0);
  }
});
