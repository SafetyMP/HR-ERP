# Static employee and HR demo

This separate Next.js app exports a browser-only navigation preview for GitHub Pages. It uses the repository's existing React, Tailwind, Radix, and Next.js dependencies and shares the production navigation labels and groups in `src/lib/navigation/role-nav.ts`. It imports no production session hooks, API clients, database modules, or employee records.

## Build and preview

From the repository root, after `npm ci`:

```bash
npm run demo:build
npm run demo:preview
```

The output is `demo/out`. `DEMO_BASE_PATH` defaults to `/HR-ERP`, matching the repository's case-sensitive GitHub project path. Set `DEMO_BASE_PATH=''` for an export hosted at a domain root, or use the actual project path for a renamed repository. Serve the output at the configured base path; do not test a project-path build by serving its assets at `/`.

There is one exported page. Internal destinations use URL hashes such as `/HR-ERP/#/employee/pto`, so refresh and browser back work without a server rewrite or custom 404 fallback. Unknown hashes display a recovery screen with a working Home link.

## Included paths

| Employee          | HR operations          |
| ----------------- | ---------------------- |
| Home              | HR overview            |
| Pay statement     | Requests & corrections |
| Time & attendance | Payroll runs           |
| Time off          |                        |
| My benefits       |                        |
| Contact HR        |                        |

Navigation and page search deliberately show only these supported demo destinations. The full application's manager, benefits administration, profile, learning, and lifecycle workflows remain in the production app; this preview does not claim to reproduce them.

## Release review case

The landing page and `#/case` open a software change review. Compare the balance shown by two illustrative portal revisions against the fixture rule for pending, approved and declined leave requests. Use the four-week worksheet to vary pilot cost, review volume and minutes saved. The worksheet counts reviewer capacity at an assumed $75 per hour. The HR systems owner uses the trial to decide how to fund review of agent-written changes. A people operations reviewer defines what employees should see and a QA lead checks the same request against both revisions. Alex represents the affected employee. This teaching exercise evaluates the team's change-review practice.

CIPD describes the people profession’s contribution to technology-enabled employee services. The UK Service Manual distinguishes product acceptance, service ownership and quality assurance. Those responsibilities guided the audience choice for this case. [CIPD Profession Map](https://www.cipd.org/en/the-people-profession/the-profession-map/explore-the-profession-map/core-knowledge/technology-people/) · [GOV.UK service team roles](https://www.gov.uk/service-manual/the-team/what-each-role-does-in-service-team)

The separate #/technical guide explains the modeled rule and links the request fixtures, browser tests and employee and HR workspaces. Use **Leave review** to return to the case.

## Employee and HR walkthrough

1. In Employee, open **Time off**, choose a fixed sample date, and **Submit sample request**.
2. Change **Demo workspace** to **HR operations** and open **Requests & corrections**.
3. Approve or decline Alex Morgan's sample request. A request cannot be reviewed twice.
4. Switch back to Employee and open **Time off**. The status reflects the HR decision. Approved hours reduce the illustrative 80-hour balance; pending and declined requests do not.
5. Use **Reset demo** to restore the starting state.

This cross-role time-off review is an illustrative demo journey, not a change to the production application's approval policies. Other bounded interactions include a sample clock-in/out action, a fixed HR question with local confirmation, and an expandable payroll review checklist. There is no payroll execution or export action.

All names and figures are synthetic. State stays in React memory and is discarded on reload. There is no storage, telemetry, login, network API call, or collection of personal information. The authorized Pages publication must upload only the validated `demo/out` artifact, never the production app or environment files.

## Accessibility and verification targets

- Desktop and mobile expose the same grouped destinations.
- The mobile drawer uses the existing Radix Sheet with focus handling and Escape dismissal.
- Page finder uses the existing Radix Dialog, supports keyboard focus and Escape, and is available through Command/Ctrl+K.
- Page search is scoped to the selected demo workspace and supports the shared task synonyms.
- Route changes focus the main content. A skip link is available on keyboard focus.
- Request outcomes and reset feedback use a polite status region.
- Verify at both desktop and narrow mobile widths, and verify the exact case-sensitive Pages base path before publication.

Build, browser-test, and publication outcomes are recorded by the parent task in `docs/product/navigation-redesign.md`; the presence of this README is not a passing test or deployment receipt.

## Authorized GitHub Pages release

The initial local candidate prepared pull-request validation and a default-branch manual-publication workflow; no publishing command had run at that baseline. The user has subsequently authorized dependency fixes, full checks, and Pages release. The current plan publishes the **validated PR artifact through `gh-pages`** and keeps the source PR open, avoiding an unrelated Vercel deployment from merging to the default branch. Pages was absent when this release amendment began. This section records the authorized plan, not a completed deployment.

Release acceptance:

1. Complete a clean locked install, obtain a fresh audit with zero known findings, and pass the full repository verification gate. Preserve the initial failed audit as historical evidence. The local deepmerge fork is documented in `vendor/deepmerge/README.md` and requires regression tests, consumer-resolution checks, and independent review.
2. Require passing remote CI, database/integration, and browser checks for the exact source PR commit. Review the final navigation, demo, dependency, and release changes independently.
3. Retain the exact source SHA and validated artifact identity. Publish only that static artifact to `gh-pages`, configure Pages to serve the branch, and record the publication commit. Do not substitute a fresh unvalidated local rebuild or merge the source PR to publish.
4. Verify the live case-sensitive project path, asset loading, deep links, navigation, and sample request/review interaction. Record observed results before claiming the demo is live.

The intended project address is `https://safetymp.github.io/HR-ERP/`; live completion evidence has not yet been recorded here. Run `npm run demo:test` to check the built artifact under its configured path before publication. Full progress and the historical local results are in `docs/product/navigation-redesign.md`.

Reference approach: [APS static demo workflow](https://github.com/SafetyMP/Agentic-Process-Safety/blob/main/.github/workflows/deploy-pages.yml), [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports), and [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

After publishing, run the same browser scenarios against the hosted artifact with `DEMO_ORIGIN=https://safetymp.github.io npm run demo:test`. This skips the local server and checks the hosted assets and interactions.
