# Completion audit — Features 014–017

**Audit date:** 2026-05-18  
**Denominator:** 30 numbered UAC (8 + 8 + 7 + 7)  
**Result:** **30 / 30 Met**

Evidence: UI routes, API wiring, Playwright specs under `tests/e2e/*-feature-01[4-7]*.spec.ts`, CI JWT mint in `scripts/ci-issue-e2e-jwts.mjs`.

---

## 014 — Hiring manager recruiting pipeline

| UAC | Met | Evidence |
| --- | --- | --- |
| 1 | Y | Home → `/manager/recruiting` (≤2 clicks); `recruiting-feature-014.spec.ts` |
| 2 | Y | `ManagerRecruitingClient` lists requisitions; empty copy |
| 3 | Y | POST requisition form |
| 4 | Y | `/manager/recruiting/requisitions/[id]` pipeline |
| 5 | Y | PATCH stage buttons SCREENING→INTERVIEW→OFFER |
| 6 | Y | POST offer + POST extend offer |
| 7 | Y | 403 plain language on list |
| 8 | Y | Reload / retry on load failure |

---

## 015 — Performance review cycle MVP

| UAC | Met | Evidence |
| --- | --- | --- |
| 1 | Y | Home → performance goals; title **Performance goals** |
| 2 | Y | `PerformanceGoalsClient` shows OPEN cycle name/dates |
| 3 | Y | POST `/api/v1/me/performance/goals`; 409 copy |
| 4 | Y | GET goals list; empty state |
| 5 | Y | Home → `/manager/team-performance`; `performance-feature-015.spec.ts` |
| 6 | Y | Manager POST with employeeId |
| 7 | Y | 403 plain language |
| 8 | Y | Retry on 5xx load |

---

## 016 — Payroll operations pay run console

| UAC | Met | Evidence |
| --- | --- | --- |
| 1 | Y | Home → `/hr/payroll-runs`; `payroll-runs-feature-016.spec.ts` |
| 2 | Y | GET runs list with period dates + instruction counts |
| 3 | Y | POST run with computed/skipped/withoutCompensation message |
| 4 | Y | `/hr/payroll-runs/[periodId]` per-employee rows |
| 5 | Y | Reissue checkbox + explicit confirm |
| 6 | Y | 403 plain language |
| 7 | Y | Retry on load failure |

---

## 017 — Employee learning self-service

| UAC | Met | Evidence |
| --- | --- | --- |
| 1 | Y | Home → `/employee/learning`; `learning-feature-017.spec.ts` |
| 2 | Y | GET `/api/v1/me/learning/enrollments` |
| 3 | Y | STATUS_LABEL map on rows |
| 4 | Y | POST complete; 409 copy |
| 5 | Y | Empty state copy |
| 6 | Y | 403 plain language |
| 7 | Y | Retry on load failure |

---

## Cumulative Track A

| Wave | UAC |
| --- | ---: |
| 001–013 (prior audit) | 85 |
| 014–017 (this audit) | 30 |
| **Total** | **115 / 115** |
