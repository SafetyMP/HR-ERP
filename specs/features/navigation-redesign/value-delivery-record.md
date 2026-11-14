# Value delivery record — navigation redesign

| Field             | Value                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Record ID         | navigation-redesign                                                                                              |
| S&OP cycle ID     | 2026-11-14-navigation-redesign                                                                                   |
| Feature brief     | [Navigation redesign](../../../docs/product/navigation-redesign.md)                                              |
| Risk tier         | T3 (standalone payroll test dependencies; calculation source unchanged)                                                                    |
| Product direction | User requested both employee and HR audiences and identified navigation as the main friction                     |
| Delivery state    | Authorized dependency remediation, full verification, and Pages release in progress; completion evidence pending |

## Outcome

Grouped task navigation, page search, readable location context, resilient task-first home screens, and a separate synthetic static demo are implemented for review.

## Authorized scope amendment (2026-11-14)

Following the initial local candidate and failed dependency audit, the user authorized dependency fixes, full checks, and GitHub Pages release. The added scope includes the lockfile, vendored npm patch script, documented local deepmerge security fork, exploit-regression/compatibility tests, and Neon SDK compatibility coverage. The original failed gate and scoped passing checks remain historical results in the feature brief.

Acceptance now requires a clean locked install, zero known findings in a fresh dependency audit, a successful full local verification gate, and required remote CI/database/browser checks for the exact source PR commit. Independent review must cover the final dependency/security and release changes as well as the navigation and demo. This record does not assert those amended checks are complete.

## Evidence

See the feature brief for actual verification results and limits. Native `navigation_audit` independently reviewed production changes; native `home_redesign` reviewed demo code it did not implement. Coordinator owns browser verification and integration. No self-approval or human acceptance is asserted.

At the historical local baseline, no PR, remote CI, Vercel deployment, Pages publication, database migration, or worker change had been performed. That statement describes the earlier candidate, not the current remote state.

The authorized publication path is the validated static PR artifact to `gh-pages`, with Pages configured for that branch. Pages was absent at the start of this amendment. Record the source commit, exact-commit remote checks, artifact identity, publication commit, and observed live result before changing delivery state to complete. Keep the source PR open; a default-branch merge and unrelated Vercel main deployment are outside this Pages release. No completed publication or customer acceptance is claimed here.

## Outcome metric

All current employee and HR destinations remain discoverable; nested routes retain their active location; mobile/keyboard navigation and a sample request/review/reset journey complete. Actual improvement in customer task time, comprehension, and satisfaction remains unmeasured and needs user evaluation.

## Local release verification update

The clean-install full gate now passes with zero known dependency audit findings, 267 unit tests, 9 UI tests and 16 payroll tests. Ten database-dependent cases remain skipped locally. The final static export and four demo browser scenarios pass. Patched authentication integration has 17 focused tests; provider responses are mocked. See the feature brief for independent review and exact evidence paths. Remote database/browser/code-scanning checks and actual Pages publication are subsequent required milestones; they are not inferred from these local results.
