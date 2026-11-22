import { expect, test } from "@playwright/test";

const base = process.env.DEMO_BASE_PATH ?? "/HR-ERP";
const origin = process.env.DEMO_ORIGIN ?? "http://127.0.0.1:3109";

test("static export loads assets under the repository path with no backend calls", async ({
  page,
}) => {
  const failed: string[] = [];
  const external: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failed.push(response.url());
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.origin !== origin ||
      url.pathname.includes("/api/")
    )
      external.push(url.href);
  });
  await page.goto(`${base}/#/employee`);
  await expect(
    page.getByRole("heading", { name: "Good morning, Alex", exact: true }),
  ).toBeVisible();
  // CSS loaded: the desktop navigation is hidden only below the lg breakpoint.
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).not.toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "artifacts/navigation-redesign/demo-employee-desktop.png",
    fullPage: true,
  });
  for (const [route, heading] of [
    ["/employee/paystub", "Pay statement"],
    ["/employee/time", "Time & attendance"],
    ["/employee/pto", "Time off"],
    ["/employee/benefits", "My benefits"],
    ["/employee/hr-request", "Contact HR"],
    ["/hr/dashboard", "HR overview"],
    ["/hr/review-queue", "Requests & corrections"],
    ["/hr/payroll-runs", "Payroll runs"],
  ]) {
    await page.goto(`${base}/#${route}`);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  expect(failed).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("request, HR review, employee status and reset form a complete demo journey", async ({
  page,
}) => {
  await page.goto(`${base}/#/employee/pto`);
  await page.getByRole("button", { name: "Submit sample request" }).click();
  await expect(
    page.getByText("DEMO-102", { exact: false }).first(),
  ).toBeVisible();
  await page.getByLabel("Demo workspace", { exact: true }).selectOption("hr");
  await page
    .getByRole("navigation", { name: /HR operations demo navigation/ })
    .getByRole("link", { name: "Requests & corrections", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Approve Alex Morgan request DEMO-102",
      exact: true,
    })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "artifacts/navigation-redesign/demo-hr-review.png",
    fullPage: true,
  });
  await page
    .getByLabel("Demo workspace", { exact: true })
    .selectOption("employee");
  await page
    .getByRole("navigation", { name: /Employee demo navigation/ })
    .getByRole("link", { name: "Time off", exact: true })
    .click();
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  await expect(page.getByText("72 hours", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page
    .getByRole("navigation", { name: /Employee demo navigation/ })
    .getByRole("link", { name: "Time off", exact: true })
    .click();
  await expect(page.getByText("80 hours", { exact: true })).toBeVisible();
  await expect(page.getByText("DEMO-102", { exact: false })).not.toBeVisible();
});

test("hash deep links survive reload and browser back", async ({ page }) => {
  await page.goto(`${base}/#/employee/paystub`);
  await expect(
    page.getByRole("heading", { name: "Pay statement", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Pay statement", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: /Employee demo navigation/ })
    .getByRole("link", { name: "My benefits", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "My benefits", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Pay statement", exact: true }),
  ).toBeVisible();
});

test("mobile drawer and page finder work without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/#/employee`);
  const open = page.getByRole("button", { name: "Open navigation" });
  await open.click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("link", { name: "Time off", exact: true }).click();
  await expect(drawer).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Time off", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find a page", exact: true }).click();
  const search = page.getByRole("textbox", { name: "Page or task" });
  await search.fill("paystub");
  await expect(
    page.getByRole("dialog").getByRole("link", { name: /Pay statement/ }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "artifacts/navigation-redesign/demo-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("release case compares revisions and opens the matching employee fixture", async ({ page }) => {
  await page.goto(base + "/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Review Alex’s leave balance");
  const statement = page.getByRole("region", { name: "Employee leave statement" });
  await expect(statement.getByText("80 h", { exact: true })).toBeInViewport();
  await expect(statement.getByText("8 h", { exact: true })).toBeInViewport();
  await expect(page.getByRole("radio", { name: "Revision B" })).toBeInViewport();
  const record = page.getByRole("region", { name: "Your release recommendation" });
  const verdict = record.getByRole("status");
  await expect(verdict).toBeEmpty();
  await expect(record).toContainText("1 of 3 request states reviewed");
  await expect(page.getByText("72 hours available")).toBeVisible();
  await page.screenshot({ path: "artifacts/navigation-redesign/demo-release-case.png" });
  await record.getByRole("button", { name: "Sign off revision A" }).click();
  await expect(verdict).toContainText("unexamined states");
  await page.getByRole("radio", { name: "Pending", exact: true }).check();
  await expect(verdict).toBeEmpty();
  await page.getByRole("radio", { name: "Approved", exact: true }).check();
  await record.getByRole("button", { name: "Sign off revision A" }).click();
  await expect(verdict).toContainText("pending request shows 72 hours");
  await record.getByRole("button", { name: "Hold revision A" }).click();
  await expect(verdict).toContainText("Your hold has a reproducible finding");
  await record.screenshot({ path: "artifacts/navigation-redesign/demo-release-finding.png" });
  await page.getByRole("radio", { name: "Revision B", exact: true }).check();
  await expect(record).toContainText("1 of 3 request states reviewed");
  await expect(verdict).toBeEmpty();
  await page.getByRole("radio", { name: "Pending", exact: true }).check();
  await page.getByRole("radio", { name: "Declined", exact: true }).check();
  await expect(page.getByText("80 hours available")).toBeVisible();
  await record.getByRole("button", { name: "Sign off revision B" }).click();
  await expect(verdict).toContainText("All three modeled balances match");
  await expect(page.getByText("20 min", { exact: true })).toBeVisible();
  await page.getByRole("region", { name: "Is the extra review worth funding?" }).screenshot({path: "artifacts/navigation-redesign/demo-release-pilot.png"});
  await expect(page.getByRole("slider", { name: /Changes reviewed/ })).toHaveValue("24");
  await expect(page.getByRole("slider", { name: /Pilot cost/ })).toHaveValue("600");
  await page.getByRole("slider", { name: /Minutes saved/ }).focus();
  await page.keyboard.press("Home");
  await expect(page.getByText("-$600", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 810 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("figure", {name: "Trace Alex’s request"})).toContainText("HR declined");
  await expect(page.getByRole("figure", {name: "Available hours for this request"})).toContainText("Displayed in portal80 h");
  const funding = page.getByRole("figure", {name: "Four-week capacity value and pilot cost"});
  await expect(funding).toContainText("Reviewer time recovered$0");
  await page.getByRole("link", {name: "Technical guide", exact: true}).click();
  await expect(page.getByRole("heading", { name: "Technical guide", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Request fixtures" })).toBeVisible();
  await page.screenshot({path: "artifacts/navigation-redesign/demo-technical-mobile.png", fullPage: true});
  await page.getByRole("link", {name: "Return to the leave review"}).click();
  await expect(page.getByRole("radio", {name: "Declined", exact: true})).toBeChecked();
  await expect(page.getByRole("slider", {name: /Minutes saved/})).toHaveValue("0");
  await page.getByRole("link", {name: "Technical guide", exact: true}).click();
  await page.reload();
  await expect(page.getByRole("link", {name: "Open the HR review queue"})).toBeVisible();
  await page.getByRole("link", { name: "Open Alex’s time off" }).click();
  await expect(page.getByRole("heading", { name: "Time off", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Return to release case" }).click();
  await expect(page.getByRole("heading", { name: "Review the change" })).toBeVisible();
});
