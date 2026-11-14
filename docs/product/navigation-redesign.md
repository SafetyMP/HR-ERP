# Employee and HR navigation redesign

## User need and scope

The user identifies navigation as the main source of friction for employees and HR professionals. This revision makes existing workflows easier to find and preserves the current Next.js, React, Tailwind, and authorization architecture. Source baseline: `181221e1319096dcf313c1578c60da507ee20dbc`.

Employees need to find pay, time off, benefits, and help without understanding the system's modules. HR professionals need direct access to requests, payroll, and benefit administration. The current flat employee menu omits existing support routes; nested pages lose their active indicator; dashboard loading hides useful shortcuts.

The design uses a persistent grouped sidebar, plain task labels, workspace and page context, a keyboard-accessible page finder, and task-first home screens. Groups remain visible rather than hiding work behind nested menus. The existing blue/neutral palette, accessible primitives, and dark theme remain the visual foundation. Manager functionality remains available.

## Acceptance

1. Every existing employee and HR navigation destination remains discoverable. Contact HR, organization, and benefit change requests become discoverable too.
2. Exactly one navigation item is active on known nested routes. Unrelated prefix strings do not match; opaque record IDs are not shown as breadcrumb labels.
3. Employees and HR professionals can find destinations by task label or synonyms in a page finder. Search is role-scoped, supports keyboard interaction, empty results, and dismissal.
4. Mobile navigation opens, closes after selection, supports Escape, and restores focus to its trigger. Desktop and mobile expose the same destination groups.
5. Both home screens expose common tasks independently of dashboard API loading or failure. Failed employee summaries are not represented as zero balances, no benefits, or off-clock status.
6. Workspace navigation does not change identity. Synthetic persona changes are explicitly labeled as demo actions. Existing API authorization is unchanged.
7. Navigation behavior, home loading/failure states, desktop/mobile layouts, and repository quality checks are verified with their actual outcomes recorded below. Automated results are not customer-usability evidence.

## GitHub Pages demo amendment

The user initially asked to consider a user demo on GitHub Pages, similar to APS. The separate static export uses the existing Next.js/React toolchain, shared navigation definitions, and synthetic data. It demonstrates employee and HR navigation and a bounded request/review interaction without login, server APIs, secrets, or external services. Demo data is clearly labeled and can be reset. The initial scope covered local preparation; the subsequent release authorization below expands it. No deployment is claimed without a verified hosted result.

## Authorized dependency and release amendment (2026-11-14)

The user has authorized dependency remediation, full verification, and GitHub Pages release. This extends the initial local-only candidate scope; its earlier failed gate and scoped checks remain historical evidence rather than current release acceptance.

The added work covers the dependency manifest and lockfile, the vendored npm patch script, a documented local `deepmerge@4.3.1-patched.1` fork for GHSA-gcqx-w48m-w2h4, security regression tests, and Neon SDK compatibility checks. Patched Better Auth uses account-based token requests, so the Neon SDK and its no-email login fallback are updated together; Google account selection uses the authenticated account list, failures remain closed, and the existing strict cookie policy is explicit. The fork must retain upstream license and provenance, must not be represented as an upstream release, and must demonstrate safe behavior for both target-copy and null-prototype/source-copy poisoning paths. Dependency updates must preserve the current application stack and authentication boundaries.

### Added acceptance checks

8. A clean locked install succeeds using the repository's Node 22/npm 10 toolchain. A fresh audit reports **zero known findings**; retain its timestamp and output. This is an audit result for that dependency graph, not a claim of universal security.
9. The local deepmerge patch has independent security review and passing exploit-regression/compatibility tests. Installed consumer resolution must use the documented fork; a version-label change or disappearance from audit output alone is insufficient.
10. The full `scripts/harness/verify.sh` gate succeeds on the final dependency and source candidate. Preserve the earlier failed run. Separately executed downstream checks do not substitute for a successful full gate.
11. Required remote CI, database/integration checks, and browser checks pass for the **exact source PR commit** selected for release. Record the commit SHA and workflow/run evidence; checks for an earlier commit do not qualify a later candidate.
12. Independent review covers navigation, demo behavior, dependency/security changes, and the publication path. Workers do not independently approve their own changes. Review findings must be resolved or explicitly retained as release blockers.
13. Publish only the validated static PR artifact to a `gh-pages` branch and configure Pages for that branch. Pages was absent at the start of this release amendment. Preserve the exact source commit, artifact identity, and published branch commit so the hosted output can be traced back to its checks.
14. Verify the hosted `/HR-ERP/` address, its case-sensitive asset paths, hash navigation, and the sample request/review journey after publication. Keep the source PR open: do not merge to the default branch or trigger the unrelated Vercel main deployment as part of this Pages release.

The current release plan supersedes the initial default-branch manual-publication plan. Source implementation, local verification, exact-commit remote verification, branch publication, and live browser validation remain distinct milestones. No completion of this amended scope is asserted in this record yet.

## Validation and continuation

The redesign was initially implemented locally on `codex/hr-navigation-redesign`. At the historical baseline below, no commit, push, customer session, production rollout, or GitHub Pages deployment had been performed. Dependency remediation and the authorized release are now in progress; the baseline is not an attestation of the current remote state or final release readiness.

### Historical local results before dependency remediation (2026-11-14)

| Check                                               | Observed result                                                                                                                                                                                                                         |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application production build                        | Passed (`artifacts/navigation-redesign/app-build.log`)                                                                                                                                                                                  |
| Static demo export                                  | Passed (`artifacts/navigation-redesign/demo-build.log`)                                                                                                                                                                                 |
| TypeScript and lint                                 | Passed; existing lint warnings remain                                                                                                                                                                                                   |
| Navigation unit tests                               | 7 passed, including destination existence and nested-route matching                                                                                                                                                                     |
| UI component tests                                  | 9 passed, including 7 new home loading/error/navigation cases                                                                                                                                                                           |
| Application browser navigation                      | 4 passed, with mocked browser session/API failures; desktop/mobile/focus/location/workspace identity behavior                                                                                                                           |
| Static demo browser                                 | 4 passed; all 9 screens load with no backend/external calls, request/review/reset, deep-link refresh/back, mobile search/drawer                                                                                                         |
| General unit tests                                  | Initial sandbox run: 234 passed, 4 failed, 10 skipped. All 4 failures were tsx IPC sandbox denials; the affected 5-test suite passed outside the sandbox. 238 unique tests passed across these runs; DB-dependent tests remain skipped. |
| Payroll package                                     | 16 passed                                                                                                                                                                                                                               |
| Prisma validation                                   | Passed                                                                                                                                                                                                                                  |
| Governance CI                                       | Passed with an advisory for optional collaboration-plan documentation                                                                                                                                                                   |
| OpenAPI drift / route policies / library boundaries | Passed; the existing grandfathered duplicate migration timestamp emits a warning                                                                                                                                                        |
| Required `scripts/harness/verify.sh`                | **FAILED at dependency audit**: 43 reported vulnerabilities (7 low, 26 moderate, 8 high, 2 critical). The lockfile is unchanged. Downstream checks were run separately; this is not a green full gate.                                  |
| Independent production review                       | `navigation_audit`: no actionable findings; independently reran 7 navigation + 7 home tests                                                                                                                                             |
| Independent demo review                             | `home_redesign`: preview-root and test-selector findings repaired and confirmed; final focus changes reviewed                                                                                                                           |
| Independent release workflow review                 | `navigation_audit`: no actionable findings; manual publication boundary, restricted permissions, pinned actions, and output/base path verified                                                                                          |

Logs and screenshots are retained locally under `artifacts/navigation-redesign/` (ignored build evidence). Final browser logs are `navigation-browser-final.log` and `demo-browser-final.log`. These prove scoped synthetic UI behavior, not production authorization or measured customer satisfaction. No database or provider was connected.

### Preview and publication plan

Run `npm run demo:build` then `npm run demo:preview`; open `http://127.0.0.1:3109/HR-ERP/`. The standalone demo has nine supported screens and in-memory synthetic actions. Full application routes remain in the normal Next.js runtime.

The initial `.github/workflows/demo-pages.yml` candidate validated pull requests and proposed default-branch manual dispatch; no remote workflow had run at the historical baseline. The authorized release now requires a validated PR artifact published through `gh-pages`, with the source PR kept open to avoid the unrelated Vercel main deployment. See the amended acceptance checks above and [demo instructions](../../demo/README.md). Publication and exact-commit remote evidence must be recorded after observation; they are not claimed here.

### Environment notes

Port 3000 was occupied and left untouched; application browser tests use 3107 and static preview uses 3109. The shared Playwright cache was removed during dependency verification; final checks used an isolated temporary browser cache (`PLAYWRIGHT_BROWSERS_PATH=/private/tmp/hr-erp-navigation-browsers`). Next dev's generated AGENTS append and governance's generated reflection report were retained under local artifacts and removed from the proposed source diff.

### Remaining validation

Customer navigation preference, real task completion time, and satisfaction are unmeasured. The next customer review should compare employees finding pay/time off/help and HR professionals finding requests/payroll/benefit changes against the original interface. Dependency remediation, full local verification, exact-commit remote CI/database/browser checks, independent review, Pages publication, and live verification are authorized in this task and remain pending completion evidence in this record. Production HR rollout, default-branch merge, and Vercel deployment are outside this Pages release scope.

## Dependency release verification (2026-11-14)

The dependency graph now uses Next 16.4.6, Neon Auth 0.7.0-beta with Better Auth/core/passkey/OAuth-provider 1.7.25, Zod 4.6.7, Vitest 4.1.12, Vite 8.3.8, Happy DOM 21.0.4, and patched HTTP/parser dependencies. Legacy minimatch consumers retain callable 3.1.5 with brace-expansion 1.1.21; modern consumers use minimatch 11.0.8. A Vitest override keeps optional peers on the project's selected major and avoids an npm 10 resolver defect. No peer-check bypass was used. The local deepmerge fork is documented in `vendor/deepmerge/README.md`; installed html-to-text consumer resolution was independently verified.

The required `scripts/harness/verify.sh` passed from a clean `npm ci`: lint (37 existing warnings, zero errors), TypeScript, security/production-safety checks, governance, contracts/boundaries, Prisma validation/generation, production build, 267 unit tests, 9 UI tests, and 16 payroll tests. Ten DB-dependent unit cases were skipped locally; remote database checks remain required. Fresh audit: zero known findings. Additional publish metadata, MCP policy, and design-token checks passed. Final demo typecheck/export, all four static browser scenarios, and all four application navigation browser scenarios passed.

Authentication compatibility coverage includes six real-SDK tests and eleven route tests. The fallback selects the Google account's internal row ID, sends the token request as POST, rejects missing/error accounts or tokens, and never substitutes a Neon session token. Strict cookie policy is explicit. These tests mock upstream responses and do not establish live provider integration.

Independent deepmerge review reproduced both original exploit paths, passed twelve regression cases and 1,500 ordinary-data differential cases, and found no patch defect. The reviewer verified all seven matcher consumers and compatible brace exports. Initial auth incompatibilities were treated as release blockers and repaired before the passing full gate. Exact-commit remote checks and hosted publication evidence will be linked from the release PR after observation.

Current local logs: `artifacts/dependency-release/full-release-gate.log`, `audit-after.json`, `demo-release-final.log`, and `navigation-final.log`. Earlier failed dependency/auth gate outputs remain retained separately. Customer usability outcomes remain unmeasured.
