# Feature brief: Employee — assigned learning (self-service)

**ID:** 017-employee-learning-self-service  
**Status:** PO approved  
**Last updated:** 2026-05-18  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Employee with **mandatory or assigned training** (compliance, onboarding, role change). |
| **Job-to-be-done** | See **assigned courses**, due dates, and **mark complete** when finished—without HR email chase. |
| **Pain today** | Assign and complete APIs exist; no employee list UI; completion-only endpoint without browse surface. |
| **Outcome** | Compliance training visibility; fewer “did you finish the module?” tickets. |
| **Scope boundary** (explicitly out of scope) | SCORM player, content authoring, LMS admin catalog UI, external provider SSO, proctoring, manager assignment UI (HR assign API remains). |

---

## Empathy / process

Employees treat training as a checklist item next to pay and PTO. Overdue training must be obvious; completion should be one deliberate action with confirmation.

---

## Personas & scenarios

1. **Given** assigned enrollments **when** employee opens **My learning** **then** they see course title, status, and due date when set.
2. **Given** an in-progress enrollment **when** employee marks complete **then** status becomes **COMPLETED** via complete API and UI reflects it.

---

## Prioritization rationale

API-complete path except **list enrollments for self**—small additive endpoint + UI; table stakes for mid-market compliance training.

---

## User acceptance criteria (UAC)

1. Employee opens **My learning** from home in **≤2 clicks** (`/employee/learning`).
2. UI loads assigned enrollments via **`GET /api/v1/me/learning/enrollments`** (to be added if missing) including course title, status, `dueAt`, and `completedAt` when present.
3. Each row shows status labels **Assigned**, **In progress**, **Completed**, **Waived**, **Expired** (map API enums).
4. Employee can **mark complete** for an eligible enrollment via `POST /api/v1/me/learning/enrollments/{id}/complete`; **409** terminal states show plain language.
5. **Empty state** explains no assignments yet or HR has not published courses.
6. **403** when token is not employee-scoped—recovery hint without stack traces.
7. Recoverable load failures offer **retry**.

---

## Friction checks

- **Task-time target:** Employee finds an overdue assignment in **under 15 seconds** after login.
- **Empty / no data state:** Friendly copy; dev hint to `demo:bootstrap` only in non-production footers.
- **Errors:** Plain language on 409 (already completed).

---

## Notes for Frontend

- Route: `/employee/learning` with `learning-client.tsx` pattern matching PTO panel.
- Engineering may add `GET /api/v1/me/learning/enrollments` + `lib/learning/enrollments.ts` list helper in same delivery—document in architecture handoff.

## API references

- **Existing:** `POST /api/v1/me/learning/enrollments/{id}/complete`
- **Required for UAC 2:** `GET /api/v1/me/learning/enrollments` (implementation task)
