# Feature UAC audits — 006–013

**Inventory date:** 2026-05-18  
**Method:** Codebase verification (routes, APIs, UI, Playwright specs where present).  
**Parent:** [`codebase-completion-baseline.md`](../codebase-completion-baseline.md)

---

## Portfolio summary (Track A extension)

| Brief | Status in brief | UAC | Met | Evidence |
| --- | --- | ---: | ---: | --- |
| **006** leave submit | Implemented (MVP) | 6 | 6 | §006 below |
| **007** pay history | Implemented (MVP) | 6 | 6 | §007 below |
| **008** manager team attendance | Implemented (MVP) | 6 | 6 | §008 below |
| **009** onboarding checklist | Implemented (MVP) | 6 | 6 | §009 below |
| **010** HR intake note | Implemented (MVP) | 6 | 6 | §010 below |
| **011** wave-2 bundle | **Implemented** (2026-05-18) | 12 | 12 | §011 below |
| **012** perf goals (demo) | Implemented (MVP demo) | 6 | 6 | §012 below |
| **013** manager perf (demo) | Implemented (MVP demo) | 7 | 7 | §013 below |

**Cumulative (001–013, excluding draft-only):** **85** UAC · **85** met (100% against numbered criteria in shipped briefs).

---

## Feature 006 — Leave submit & status

| # | Summary | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Submit + list from `/employee/pto` ≤2 clicks from home | **Met** | [`time-off-requests-panel.tsx`](../../src/app/employee/pto/time-off-requests-panel.tsx) on PTO page |
| 2 | POST range validation (14-day cap, inverted range) | **Met** | [`src/app/api/v1/me/time-off/requests/route.ts`](../../src/app/api/v1/me/time-off/requests/route.ts) |
| 3 | GET newest-first with status labels | **Met** | Panel + API |
| 4 | Permission-missing UI | **Met** | 403 copy in panel |
| 5 | Retry without internal codes | **Met** | Panel error states |
| 6 | Demo PENDING + APPROVED rows | **Met** | [`scripts/seed-predictive-demo.ts`](../../scripts/seed-predictive-demo.ts) |

Playwright: [`tests/e2e/leave-requests-feature-006.spec.ts`](../../tests/e2e/leave-requests-feature-006.spec.ts)

---

## Feature 007 — Pay history summaries

| # | Summary | Status | Evidence |
| --- | --- | --- | --- |
| 1–6 | History list, navigation, empty/error, terminology, QA | **Met** | [`paystub-history-client.tsx`](../../src/app/employee/paystub/history/paystub-history-client.tsx), [`GET /api/v1/me/paystub/history`](../../src/app/api/v1/me/paystub/history/route.ts) |

Playwright: [`tests/e2e/pay-history-feature-007.spec.ts`](../../tests/e2e/pay-history-feature-007.spec.ts)

---

## Feature 008 — Manager team attendance today

| # | Summary | Status | Evidence |
| --- | --- | --- | --- |
| 1–6 | Manager route, team snapshot, empty/error, friction | **Met** | [`manager/team-attendance`](../../src/app/manager/team-attendance/), [`GET /api/v1/manager/team/attendance/today`](../../src/app/api/v1/manager/team/attendance/today/route.ts) |

Playwright: [`tests/e2e/manager-team-attendance-feature-008.spec.ts`](../../tests/e2e/manager-team-attendance-feature-008.spec.ts)

---

## Feature 009 — Onboarding checklist

| # | Summary | Status | Evidence |
| --- | --- | --- | --- |
| 1–6 | Employee tasks list, status ladder, empty/error | **Met** | [`onboarding-client.tsx`](../../src/app/employee/onboarding/onboarding-client.tsx), [`GET /api/v1/me/onboarding/tasks`](../../src/app/api/v1/me/onboarding/tasks/route.ts) |

Playwright: [`tests/e2e/onboarding-feature-009.spec.ts`](../../tests/e2e/onboarding-feature-009.spec.ts)

---

## Feature 010 — HR payroll intake note

| # | Summary | Status | Evidence |
| --- | --- | --- | --- |
| 1–6 | Employee HR case create/list, validation, friction | **Met** | [`hr-case-client.tsx`](../../src/app/employee/hr-request/hr-case-client.tsx), [`/api/v1/me/hr-case-requests`](../../src/app/api/v1/me/hr-case-requests/route.ts) |

Playwright: [`tests/e2e/hr-case-feature-010.spec.ts`](../../tests/e2e/hr-case-feature-010.spec.ts)

---

## Feature 011 — Wave-2 bundle (011–018 sub-capabilities)

Brief status updated to **Implemented** 2026-05-18.

| # | Capability | Status | Evidence |
| --- | --- | --- | --- |
| 1–2 | Manager leave approve/deny | **Met** | [`manager/team-leave`](../../src/app/manager/team-leave/), [`/api/v1/manager/team/time-off/*`](../../src/app/api/v1/manager/team/time-off/) |
| 3–4 | HR case lifecycle | **Met** | Employee + [`/api/v1/hr/case-requests/*`](../../src/app/api/v1/hr/case-requests/) |
| 5 | Tax summaries | **Met** | [`tax-documents-client.tsx`](../../src/app/employee/tax-documents/tax-documents-client.tsx), [`/api/v1/me/tax-documents/summary`](../../src/app/api/v1/me/tax-documents/summary/route.ts) |
| 6 | Benefits election intent | **Met** | [`benefits-election-intent-client.tsx`](../../src/app/employee/benefits/election-change/benefits-election-intent-client.tsx) |
| 7–8 | Punch corrections | **Met** | Manager + HR review APIs and UI |
| 9–10 | Onboarding templates + apply | **Met** | [`hr/onboarding-templates`](../../src/app/hr/onboarding-templates/), apply-template route |
| 11 | Separation tasks | **Met** | [`leaving/separation-tasks-client.tsx`](../../src/app/employee/leaving/separation-tasks-client.tsx) |
| 12 | Organization context | **Met** | [`organization-context-client.tsx`](../../src/app/employee/organization/organization-context-client.tsx) |

---

## Features 012–013 — Performance goals (demo)

Demo-scoped; UAC met against read-only/demo JWT flows. See briefs and [`goals-demo-client.tsx`](../../src/features/performance/goals-demo-client.tsx).

---

## Intentional v1 exclusions (still future briefs)

Manager approval engines beyond 011, PDF/W-2 delivery, full COBRA/834, e-sign onboarding, production statutory tax tables (see [`docs/compliance/us-federal-withholding-placeholder.md`](../../docs/compliance/us-federal-withholding-placeholder.md)).
