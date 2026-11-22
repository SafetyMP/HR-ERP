# The leave-balance release review

A QA lead has two revisions of a time-off change. Both show 72 hours for Alex Morgan after eight hours of leave are approved. People operations supplies the rule. The HR systems owner sponsors a four-week shadow pilot and retains the existing release approver. Check the pending and declined paths, record a hold or sign-off, and compare a checklist, a focused regression test and an evidence-collection harness. The worksheet estimates reviewer capacity at $75 per hour. Its defaults are illustrative. A pilot should also track escaped balance errors and release delays. [Open the case](https://safetymp.github.io/HR-ERP/) · [Stakeholder responsibilities in the UK Service Manual](https://www.gov.uk/service-manual/the-team/what-each-role-does-in-service-team) · [CIPD on technology and people](https://www.cipd.org/en/the-people-profession/the-profession-map/explore-the-profession-map/core-knowledge/technology-people/)

## Follow one request

Select revision A and Pending in the case. Open **Inspect this balance calculation**. The inspector carries Alex’s date, hours, revision and request state into a request → manager decision → employee statement trace. Compare the selected run with revision B’s pending run. B’s different display cannot verify the change in A. Returning to the case preserves the selection, recommendation and worksheet during the session. Bookmarks preserve the revision and request state and, in the inspector, the selected run. Reloading starts a fresh review record and worksheet. [Open the pending A trace](https://safetymp.github.io/HR-ERP/#/technical?revision=A&state=Pending&run=A-pending)

## Replay provenance and boundaries

Each of the six observations was read from the original static export at commit b03073d. To reproduce, build that revision using the steps below, open a fresh Chromium page for each revision and request state, and read the opening, expected and displayed hours under **Available hours for this request**. The archived values remain fixed when the current model changes. The browser tests compare the live model with all six observations. [Original review implementation](https://github.com/SafetyMP/HR-ERP/blob/b03073d125a1e6a7cf5af0a862ffc622a7787d7b/demo/app/release-case.tsx) · [Captured observations](app/leave-evidence.json) · [Browser tests](../tests/demo/static-demo.spec.ts)

The production manager service records a decision for a pending request. The PTO summary reads the latest dated balance separately. Validating a real balance posting requires a request, its authorization and a reconciled balance snapshot for the same employee and effective date. This browser fixture measures neither backend correctness nor pilot savings. [Manager decision service](../lib/leave/manager-team-time-off-service.ts) · [Employee balance query](../lib/pto/get-pto-summary.ts) · [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) · [DORA delivery metrics](https://dora.dev/guides/dora-metrics/)

## Run and verify

From the repository root use Node 22 and the project npm version. Run `npm ci`, `npm run demo:build`, then `npm run demo:preview`. The static export lives in `demo/out` and uses the GitHub Pages path `/HR-ERP/` by default. Run `npm run demo:test` against the build with the pinned Playwright Chromium installed.
