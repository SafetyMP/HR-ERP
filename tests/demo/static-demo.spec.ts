import { expect, test } from "@playwright/test";
import capture from "../../demo/app/leave-evidence.json";

const base = process.env.DEMO_BASE_PATH ?? "/HR-ERP";
const origin = process.env.DEMO_ORIGIN ?? "http://127.0.0.1:3109";
const home = base + "/";
const title = "Can Alex count on those hours?";
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
    page.getByRole("heading", { name: "One day off, three views" }),
  ).toBeVisible();
  await expect(page.locator(".case-balance")).toHaveCount(0);
  await page
    .getByRole("link", { name: "Open Alex’s leave file" })
    .press("Enter");
  await expect(page.locator("#file-heading")).toBeFocused();
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
  await page
    .getByText("Would the HR systems owner fund a four-week pilot?", {
      exact: true,
    })
    .click();
  await page.getByText("Adjust pilot assumptions", { exact: true }).click();
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
  await expect(page.locator(".case-guide")).toContainText("72 h displayed");
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
  await expect(page.locator(".case-guide")).toContainText("80 h displayed");
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
  await page.getByRole("link", { name: "Open Alex’s leave file" }).click();
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

test("the prior close reconciles dated records and keeps waiver distinct from coverage", async ({
  page,
}) => {
  await page.goto(home + "#/case?revision=A&state=Pending");
  await page
    .getByText("Reopen the November payroll handoff", { exact: true })
    .click();
  const button = (name: string) =>
    page.getByRole("button", { name, exact: true });
  await button("PI-686 · Oct 16–31").click();
  await expect(page.locator(".desk-feedback")).toContainText("October");
  await button("HR-58 · effective Nov 16").click();
  await expect(page.locator(".desk-feedback")).toContainText(
    "after the period",
  );
  await button("PI-702 · Nov 1–15").click();
  await button("Waive Casey’s check").click();
  await expect(page.locator(".close-strip")).toContainText("0 open");
  await button("Lock this register for Finance").click();
  await button("Prepare artifact summary").click();
  await expect(page.locator(".close-case")).toContainText(
    "2 instructions · $3,940",
  );
  await page.getByRole("link", { name: "Trace this payroll handoff" }).click();
  await expect(page.locator(".tech-panel")).toContainText(
    "separate correction",
  );
  await page.getByRole("link", { name: "Change review", exact: true }).click();
  await page.getByLabel("Changed component").selectOption("migration");
  await expect(page.locator(".tech-panel .trace-receipt")).toContainText("T2");
  await page.getByLabel("Changed component").selectOption("kernel");
  await expect(page.locator(".tech-panel .trace-receipt")).toContainText("T3");
  await page.getByRole("link", { name: /Return to revision/ }).click();
  await button("Restart the close").click();
  for (const name of [
    "PI-702 · Nov 1–15",
    "HR-52 · effective Nov 1",
    "Rerun Casey only",
    "Reconcile new instruction and resolve",
    "Lock this register for Finance",
    "Prepare artifact summary",
  ])
    await button(name).click();
  await expect(page.locator(".close-case")).toContainText(
    "3 instructions · $5,460",
  );
  await expect(page.locator(".close-case")).toContainText("after cutoff");
});
