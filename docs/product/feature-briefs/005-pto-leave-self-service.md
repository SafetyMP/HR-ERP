# Feature brief: Employee self-service — PTO balance & recorded time off

**ID:** 005-pto-leave-self-service  
**Status:** Done  
**Last updated:** 2026-05-09  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Benefit-eligible employee planning time away and **HR Operations** reducing “how many hours do I have?” inbox noise. |
| **Job-to-be-done** | Employee sees **current PTO balance (hours)** and **recent dates already recorded as time off** in one calm view — without opening payroll or a legacy portal. |
| **Pain today** | Balances live in spreadsheets or siloed HRIS tabs; employees guess accruals; managers answer the same question weekly during peak vacation seasons. |
| **Outcome** | Fewer repetitive HR tickets; employees reconcile planned leave against **what the system shows on file** before submitting changes through normal channels. |
| **Scope boundary** (explicitly out of scope) | **Not in v1:** submitting new leave requests, manager approvals, accrual engines, carryover policy automation, jurisdiction-specific sick vs vacation splits, or negative-balance overrides. |

---

## Empathy / process

PTO is emotional — weddings, caregiving, burnout prevention. The UI must state clearly what is **informational** (“balance as of date”) versus **not yet actionable here** (request workflow stays with HR / another module). Never imply the employee “lost” hours because of a sparse chart.

---

## Personas & scenarios

1. **Given** open enrollment for summer vacations **When** an employee opens PTO **Then** they see **balance hours** with an **as-of date** when HR has posted one.
2. **Given** HR records historical time-off dates **When** the employee scrolls recent activity **Then** they see **calendar dates** for recorded time off (newest first), not raw internal keys.
3. **Given** Payroll warns about informal tracking **When** Legal reviews transparency **Then** copy avoids promising accruals or approvals — **read-only snapshot** language only.

---

## Prioritization rationale

Balances sit beside pay (Feature 001), time (Feature 002), and profile (Feature 004). Reusing existing `PtoBalance` and `PtoRequest` tables ships empathy-heavy value without accrual workflow scope creep.

---

## User acceptance criteria (UAC)

1. From the default employee landing path, the worker reaches the **PTO summary** in **no more than two intentional navigational actions** after authentication.
2. When a balance row exists, the UI shows **PTO balance in hours** plus a visible **as-of date** using plain HR language (**balance as of …**).
3. The UI lists **recent recorded time-off dates** (from system-of-record rows visible to the employee), **newest first**, each date readable without ISO-only formatting.
4. If **no balance and no recorded dates** exist for the employee, the UI shows a **dedicated empty state** that explains HR may not have posted data yet — **no blank screen**.
5. On load failure, the employee sees **retry-oriented guidance** with **no stack traces or internal error codes** surfaced in the UI.
6. **Navigation and headings** use **PTO** as the primary term for QA (subtitle may say **Leave** / **time off**); a timed QA script confirms the worker can **scan balance + recent dates sections** in **under 60 seconds** after landing.

---

## Friction checks

- **Task-time target:** Balance + recent dates recognizable in **under 60 seconds** for a seeded returning user.
- **Empty / no data state:** HR-posted data may lag — supportive wording, optional contact HR / manager per locale.
- **Errors:** Single recovery action; never dump validation internals.

---

## Notes for Frontend

- Primary nav label: **PTO** (`/` → `/employee/pto`).
- Page `<h1>`: **Your PTO** (or equivalent) with eyebrow **Time off**.
