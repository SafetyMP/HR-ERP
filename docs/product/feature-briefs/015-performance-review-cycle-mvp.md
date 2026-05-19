# Feature brief: Performance — review cycle MVP (beyond demo goals)

**ID:** 015-performance-review-cycle-mvp  
**Status:** PO approved  
**Last updated:** 2026-05-18  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Employee and people manager during an **open performance cycle** (goal-setting season). |
| **Job-to-be-done** | Participate in a named **performance cycle**: view cycle context, **author goals** in-product, and let managers see **direct-report goals**—replacing demo-only read shells (briefs 012/013). |
| **Pain today** | `GET /api/v1/me/performance/goals` works but UI is demo-labeled; cycle administration and goal **create** are API-only; managers lack a cohesive team view tied to cycle. |
| **Outcome** | Predictable merit/goal season entry point; fewer spreadsheet exports; parity with mid-market “goals + cycle” baseline (not full calibration suite). |
| **Scope boundary** (explicitly out of scope) | 360 feedback, calibration sessions, compensation merit matrix, ratings aggregation, continuous feedback feeds, mobile-specific polish beyond responsive layout. |

---

## Empathy / process

Employees want to know **which cycle** their goals belong to and whether they can still edit them. Managers need the same cycle boundary when coaching—without HRIS training.

---

## Personas & scenarios

1. **Given** an **OPEN** performance cycle **when** an employee opens **My performance goals** **then** the page shows cycle name and date range.
2. **Given** an open cycle **when** the employee submits a new goal title **then** it persists via `POST /api/v1/me/performance/goals` and appears in the list.
3. **Given** a manager with direct reports in the cycle **when** they open **Team performance goals** **then** they see each report’s goals for the active cycle via manager APIs.

---

## Prioritization rationale

Extends shipped demo shells (012/013) with write paths already on `lib/performance/goals.ts` and cycle APIs—low schema churn, high retention value for mid-market.

---

## User acceptance criteria (UAC)

1. Employee opens **My performance goals** from home in **≤2 clicks**; page title uses **Performance goals** (drop “demo” from primary heading).
2. When an **OPEN** cycle exists, UI displays **cycle name** and **start/end dates** (from `GET /api/v1/performance/cycles` or embedded goal payload).
3. Employee can **create a goal** (title required) via `POST /api/v1/me/performance/goals` when cycle status is **OPEN**; **409** when cycle closed shows plain-language copy.
4. Employee **lists goals** for the active cycle via `GET /api/v1/me/performance/goals`; empty state explains HR must open a cycle or run bootstrap.
5. Manager opens **Team performance goals** in **≤2 clicks** from home; lists direct-report goals via `GET /api/v1/manager/performance/goals`.
6. Manager can **create a goal for a direct report** via `POST /api/v1/manager/performance/goals` when cycle is **OPEN** (optional `employeeId` selector when multiple reports).
7. **403** paths use plain language for wrong persona token.
8. Recoverable errors on load allow **retry** without exposing stack traces.

---

## Friction checks

- **Task-time target:** Employee adds one goal in **under 45 seconds** after authentication (excluding token paste in dev).
- **Empty / no data state:** Distinguishes “no open cycle” vs “no goals yet.”
- **Errors:** Retry on 5xx only.

---

## Notes for Frontend

- Extend [`src/app/employee/performance/goals/page.tsx`](../../../src/app/employee/performance/goals/page.tsx) and [`src/app/manager/team-performance/`](../../../src/app/manager/team-performance/); remove demo-only chrome where UAC requires production labels.
- HR cycle **create/close** may remain API-first; optional link “HR: manage cycles” only for `hr_admin` if policy exists—otherwise out of v1 UI.

## Supersedes / relates

- Supersedes **demo-only** acceptance intent of **012** and **013** for goal **authoring** and cycle context; 012/013 routes remain canonical paths.

## API references (existing)

- `GET|POST /api/v1/performance/cycles`, `PATCH /api/v1/performance/cycles/{id}`
- `GET|POST /api/v1/me/performance/goals`
- `GET|POST /api/v1/manager/performance/goals`
