# Feature brief: Manager — team performance goals (demo shell)

**ID:** 013-manager-team-performance-goals-demo  
**Status:** Implemented (MVP demo) · **Last updated:** 2026-05-09  

## PO gate

| Item | Answer |
|------|--------|
| **Primary user** | People manager preparing for check-ins who needs visibility into **direct reports’ goals**. |
| **Job-to-be-done** | Scan team goals authored in Core HR without switching to HR admin tools. |
| **Pain today** | Manager could POST goals but had **no read surface** aligned with employee self-service demos. |
| **Outcome** | `GET /api/v1/manager/performance/goals` + `/manager/team-performance` page listing report rows with display names. |
| **Out of scope (v1)** | Editing goals inline, bulk calibration, compensation linkage, filters beyond optional `cycleId` query on API. |

## User acceptance criteria

1. Manager opens **Team performance goals** from home in **≤2 clicks** (`/manager/team-performance`).
2. Page copy clarifies **direct-report** scope and points to **Organization context** for hierarchy debugging.
3. With a valid **manager** dev JWT (`subject_employee_id` = manager’s Core HR row), **GET** returns goals **only** for employees where `managerId` matches — no cross-team leakage (server enforced).
4. Each row shows **report display name** + goal title + status / weight / progress fields returned by the API.
5. **403 / missing employee context** uses the same plain-language recovery pattern as other manager surfaces.
6. **Empty list** distinguishes “no direct reports” / “no goals yet” with bootstrap guidance — no misleading error state.
7. Optional **`?devJwt=`** in development pre-fills bearer token.

## Friction checks

- **Task-time target:** Under ~20 seconds to scan a small team once token is pasted.
- **Empty / no data state:** References demo bootstrap and manager hierarchy seeding.
- **Errors:** No internal permission codes in user-visible success path.
