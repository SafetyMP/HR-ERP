import { test, expect } from "@playwright/test";

const base = process.env.DEMO_BASE_PATH ?? "/HR-ERP";
const origin = process.env.DEMO_ORIGIN ?? "http://127.0.0.1:3109";

test("published desk loads its assets under the project path without backend calls", async ({
  page,
}) => {
  const failed: string[] = [];
  page.on("pageerror", (error) => failed.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== origin || url.pathname.includes("/api/"))
      failed.push(url.href);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failed.push(response.url());
  });
  await page.goto(base + "/");
  await expect(
    page.getByRole("heading", { name: "Friday payroll close" }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /Total 2 of 3/ })).toContainText(
    "$3,940",
  );
  await expect(
    page.getByRole("button", { name: /Rerun Casey only/ }),
  ).toBeDisabled();
  await page.screenshot({
    path: "artifacts/navigation-redesign/payroll-close-desktop.png",
  });
  expect(failed).toEqual([]);
});
test("waiving both exceptions closes the queue without covering the new hire", async ({
  page,
}) => {
  await page.goto(base + "/");
  await page.getByRole("button", { name: /Waive without matching/ }).click();
  await page
    .getByRole("button", { name: /Waive missing compensation/ })
    .click();
  await expect(page.getByText("0 open", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Lock computed period/ }).click();
  await expect(
    page.getByText(/Casey has no instruction in this batch/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Apply HR-52/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Prepare artifact summary" }).click();
  await expect(page.locator(".receipt").first()).toContainText(
    "2 instructions · $3,940 net",
  );
  await page.getByRole("button", { name: "Restart exercise" }).click();
  await expect(page.getByText("2 open", { exact: true })).toBeVisible();
});
test("checking both people and correcting the omission produces a complete, late batch", async ({
  page,
}) => {
  await page.goto(base + "/");
  await page.getByRole("button", { name: /Match PI-702/ }).click();
  await page.getByRole("button", { name: /Apply HR-52/ }).click();
  await page.getByRole("button", { name: /Rerun Casey/ }).click();
  await expect(
    page.getByRole("row", { name: /Casey Rivera PI-703/ }),
  ).toContainText("$1,520");
  await expect(
    page.getByRole("button", { name: /Rerun Casey/ }),
  ).toBeDisabled();
  await expect(page.getByText("1 open", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Reconcile new instruction/ }).click();
  await page.getByRole("button", { name: /Lock computed period/ }).click();
  await expect(
    page.getByRole("heading", { name: "Locked after cutoff" }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /Total 3 of 3/ })).toContainText(
    "$5,460",
  );
  await page.getByRole("button", { name: "Prepare artifact summary" }).click();
  await expect(
    page.getByText("Artifact summary", { exact: true }),
  ).toBeVisible();
  await page.locator(".handoff").screenshot({
    path: "artifacts/navigation-redesign/payroll-close-outcome.png",
  });
});
test("targeted correction can meet cutoff while finance inherits outstanding verification", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/#/case");
  await page.getByRole("button", { name: /Waive without matching/ }).click();
  await page.getByRole("button", { name: /Apply HR-52/ }).click();
  await page.getByRole("link", { name: "Component reference" }).click();
  await expect(
    page.getByRole("heading", { name: "Component reference" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Exception register" }),
  ).toHaveAttribute("href", /payroll-exceptions.ts$/);
  await page.getByRole("link", { name: "Return to the close desk" }).click();
  await page.getByRole("button", { name: /Rerun Casey/ }).click();
  await page.getByRole("button", { name: /Reconcile new instruction/ }).click();
  await page.getByRole("button", { name: /Lock computed period/ }).click();
  await expect(
    page.getByRole("heading", { name: "Locked by cutoff" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Finance inherits that verification task/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "artifacts/navigation-redesign/payroll-close-mobile.png",
    fullPage: true,
  });
  await page.goto(base + "/#/hr/review-queue");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Component reference" }),
  ).toBeVisible();
});

test("a prior instruction and a future-dated compensation record cost time without clearing the discrepancy", async ({
  page,
}) => {
  await page.goto(base + "/");
  await expect(page.getByText("Oct 16–31 · $1,760 net")).toBeVisible();
  await page
    .locator(".queue")
    .screenshot({
      path: "artifacts/navigation-redesign/payroll-close-source-packet.png",
    });
  await page.getByRole("button", { name: /Match PI-686/ }).click();
  await expect(page.getByRole("status")).toContainText("October period");
  await page.getByRole("button", { name: /Apply HR-58/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "after the period ended",
  );
  await expect(
    page.getByRole("button", { name: /Rerun Casey only/ }),
  ).toBeDisabled();
  await expect(page.getByText("2 open", { exact: true })).toBeVisible();
  await expect(page.getByText("14:57", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: /Apply HR-52/ }).click();
  await page.getByRole("button", { name: /Rerun Casey only/ }).click();
  await page.getByRole("button", { name: /Lock computed period/ }).click();
  await expect(
    page.getByRole("heading", { name: "Locked after cutoff" }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /Total 3 of 3/ })).toContainText(
    "$5,460",
  );
});
