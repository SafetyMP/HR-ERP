# Feature brief: Benefits life events MVP

**ID:** 019-benefits-life-events-mvp  
**Status:** PO approved  
**Last updated:** 2026-05-18  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Employee reporting a qualifying life event; HR benefits specialist reviewing the queue. |
| **Job-to-be-done** | Employee **submits a life event** with date and type; HR **reviews and applies or denies**; loss-of-coverage may link to a **COBRA event** row (status only—no notice generation). |
| **Pain today** | Feature 003 is read-only summary; election-change intent exists but no structured life-event workflow. |
| **Outcome** | Fewer email threads; auditable queue; path to COBRA when counsel approves notices. |
| **Scope boundary** (explicitly out of scope) | Carrier 834 feeds, COBRA notice PDFs, open-enrollment plan shopping, premium dollar quotes. |

---

## User acceptance criteria (UAC)

1. Employee opens **Life events** within **≤2 clicks** from benefits area (`/employee/benefits/life-events`).
2. Employee submits event with **type**, **event date**, and short description via `POST /api/v1/me/benefits/life-events`.
3. Employee sees **their submitted events** with status labels (Submitted, Under review, Applied, Denied).
4. HR opens **Life event queue** at `/hr/benefits/life-events` listing pending items for the tenant.
5. HR can **approve** or **deny** with optional note; employee-visible status updates.
6. For **loss of coverage**, approve path creates or links a `CobraEvent` in `PENDING_NOTICE` (no automated notice send).
7. **403** for wrong role—plain language.
8. Recoverable load failures offer **retry**.

---

## Friction checks

- **Task-time target:** Employee submits a life event in **under 60 seconds**.
- **Empty state:** Guidance when no events on file.
