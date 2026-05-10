# Feature brief: Employee — performance goals (demo shell)

**ID:** 012-employee-performance-goals-self-service-demo  
**Status:** Implemented (MVP demo) · **Last updated:** 2026-05-09  

## PO gate

| Item | Answer |
|------|--------|
| **Primary user** | Employee in merit / goal-setting season who needs a fast read of their authored goals. |
| **Job-to-be-done** | See **my performance goals** linked to Core HR without exporting spreadsheets. |
| **Pain today** | Phase 3 APIs existed (`GET /api/v1/me/performance/goals`) while home navigation hid the capability. |
| **Outcome** | One predictable UI entry point + parity with dev JWT / session bearer pattern used on paystub. |
| **Out of scope (v1)** | Editing weights, manager calibration, cycle picker UX beyond optional query param, mobile polish beyond responsive stack. |

## User acceptance criteria

1. Employee opens **My performance goals** from home in **≤2 clicks** (`/employee/performance/goals`).
2. Page explains data comes from Core HR and links to the **capability hub** for seeded inventory.
3. With a valid **employee** dev JWT (`subject_employee_id` aligned to seeded employee), **GET** loads goals into the list without exposing raw API codes on success.
4. **401 / missing employee context** shows plain-language recovery (token / role hint), not stack traces.
5. **Empty goals** explains bootstrap / open cycle expectation — no silent blank chrome.
6. Optional **`?devJwt=`** query param in development pre-fills the bearer token (same pattern as paystub).

## Friction checks

- **Task-time target:** Under ~15 seconds to scan titles and statuses once token is pasted (demo shell).
- **Empty / no data state:** Points to `npm run demo:bootstrap` and open performance cycle.
- **Errors:** Retry suggestion only when status ≥ 500.
