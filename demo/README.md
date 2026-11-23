# A day off and the HR service desk

Alex asks for eight hours of leave for December 14. People Operations needs to know whether the employee portal agrees with the manager’s decision. Open the leave file, compare revisions A and B, then record a hold or sign-off against the states you inspected. A separate November payroll exercise brings back the register, dated source records, targeted retry and Finance handoff from the earlier close desk. Both are synthetic cases. [Open the case](https://safetymp.github.io/HR-ERP/).

## Framework and technical guide

The repository classifies code changes on a T0–T4 risk scale and routes review according to the affected paths. In the case, HR supplies a testable rule, QA checks the same revision and decision, and the HR systems owner gives the release approver the evidence. The four-week pilot uses illustrative capacity assumptions. The employee's manager separately approves or declines the request.

The guide opens one component at a time. Follow the selected request to its dated balance, compare one of six recorded browser runs, inspect the current session's payroll register, or explore the review plan for a real file path. Bookmarks preserve the selected leave revision, state, comparison run and guide panel. Payroll actions and recommendations are local to the current visit. The release fixture does not write to application records.

[UW–Madison manager guidance](https://hr.wisc.edu/hr-guides/for-managers-and-supervisors/managing-employees-time-off-requests/) · [University of Florida payroll review](https://cfo.ufl.edu/procedures-training-resources/payroll/timekeeping-review-and-approval/) · [Original payroll exercise](https://github.com/SafetyMP/HR-ERP/tree/24b8bc9/demo/app) · [Repository design and scope](../docs/DESIGN-PIVOT.md).

## Run and verify

From the repository root use Node 22 and the project npm version. Run `npm ci`, `npm run demo:build`, then `npm run demo:preview`. The static export lives in `demo/out` and uses the GitHub Pages path `/HR-ERP/` by default. Run `npm run demo:test` against the build with the pinned Playwright Chromium installed.
