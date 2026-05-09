# Feature brief: Onboarding checklist — employee self-service

**ID:** 009-onboarding-checklist-self-service  
**Status:** Implemented (MVP) · **Last updated:** 2026-05-09  

## PO gate

| Item | Answer |
|------|--------|
| **Primary user** | New hire during first 30–90 days. |
| **Job-to-be-done** | See **assigned onboarding tasks**, due hints, and **mark progress** toward completion. |
| **Pain today** | Tasks trapped in email / spreadsheets; employee uncertainty slows readiness. |
| **Outcome** | Higher completion rates before day-30 checkpoints; HR spends less time chasing status. |
| **Out of scope (v1)** | Document e-sign integrations, provisioning automation, bulk HR assignment UI. |

## User acceptance criteria

1. Employee reaches **Onboarding** from home in **≤2 navigational actions**.
2. Tasks list **title**, **status**, optional **due date** (date-only display).
3. Allowed transitions: **PENDING → IN_PROGRESS → DONE** (no backwards edits via API).
4. **Empty state** when no tasks seeded — supportive wording.
5. PATCH failures surface **retry** guidance without technical leaks.
6. Demo seed includes mix of **DONE / IN_PROGRESS / PENDING** for QA.

## Friction checks

- Primary actions obvious (**Start**, **Mark done**) without tooltip overload.
