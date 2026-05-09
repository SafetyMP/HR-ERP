# Feature brief: Employee self-service — current paystub (earnings statement)

**ID:** 001-employee-paystub-self-service  
**Status:** PO approved  
**Last updated:** 2026-05-09  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Active employee (including confused new hire) and stressed HR Director who currently fields “where is my paystub?” tickets. |
| **Job-to-be-done** | Employee: confirm this pay period’s **gross pay, deductions, taxes, and net pay** without HR intervention. HR: deflect repetitive pay inquiries with a trustworthy self-service path. |
| **Pain today** | Employees hunt through email, portals, or call HR; duplicate explanations; payroll errors discovered late; new hires don’t know where **earnings statements** live. |
| **Outcome** | First-line pay questions drop; employees verify pay in one session; support time for “how do I see my check?” approaches zero for in-scope cases. |
| **Scope boundary** (explicitly out of scope) | **Not in v1:** prior-year W-2, contractor payments, off-cycle adjustments workflow, changing direct deposit, employer payroll admin run, multi-jurisdiction tax advice, or printing on paper. |

---

## Empathy / process

Viewing a **paystub** is not “open a PDF row.” It is a moment of personal financial anxiety: rent is due, a deduction looks wrong, or a new hire is proving to themselves that payroll is real. The experience must feel **obvious, calm, and authoritative**. Wrong labels (“Record #47”) increase distrust and drive calls to HR. If the employee cannot find the **current period earnings statement** immediately after login, the product has failed them and multiplied HR load.

---

## Personas & scenarios

1. **Given** a new employee on day one with payroll active **When** they open the product for the first time **Then** they can reach their **most recent paystub** without reading help text or asking a peer.
2. **Given** an employee who was paid in the last pay cycle **When** they open self-service payroll **Then** they see the **current (latest finalized) paystub** first, with **pay period** dates and **net pay** visible without extra clicks.
3. **Given** an employee whose paystub is not yet generated for the current cycle **When** they open the paystub area **Then** they see a clear **empty state** explaining when paystubs typically appear (no blank screen, no technical error).
4. **Given** HR is audited on **wage and tax transparency** **When** an employee views a paystub **Then** labels match common payroll terms (**earnings, deductions, taxes, employer contributions** where applicable) so screenshots are explainable to Legal or a manager.

---

## Prioritization rationale

This is foundational **employee self-service**: maximum reduction in HR/Payroll “where’s my pay?” volume per line of product effort. Deferred: full pay history navigation, W-2, and deep links from notifications — only after the **current paystub** path is frictionless.

---

## User acceptance criteria (UAC)

1. After authentication, the employee can open their **current earnings statement** (latest finalized **paystub**) with **no more than two intentional navigational actions** from the default home/dashboard (e.g. one tap on an affordance labeled for pay, then confirm period).
2. The paystub view shows **pay period begin and end dates**, **gross pay**, itemized **pre-tax deductions**, **taxes**, and **net pay** using **standard payroll / HR terminology** (not internal field names or database IDs).
3. If no paystub exists for the employee (new hire not yet paid, or data not loaded), the UI shows a **dedicated empty state** in plain language stating that there is **no paystub available yet** and when to check again or who to contact if payroll should have posted.
4. If paystub data cannot load due to a system error, the user sees a **recoverable error** message (retry or try later) with **no stack traces or error codes** exposed to the employee.
5. HR terminology consistency: the UI uses **paystub** or **earnings statement** consistently in navigation and headings (one primary term per locale; document the chosen term in release notes for QA).
6. The “view current paystub” flow is completable by a first-time user on a clean device in **under 10 seconds** from landing after login, timed from standardized QA test scripts **excluding** network latency outside the app’s control.

---

## Friction checks

- **Task-time target:** Current paystub discoverable and readable in **under 10 seconds** after login (see UAC 6).
- **Empty / no data state:** Explains **no paystub yet** without blaming the user; optional line on typical posting timing if known to the org.
- **Errors:** One sentence what happened + one action (**Retry**, **Try again later**, or **Contact Payroll** with a single path).

---

## Notes for Frontend

- Primary navigation label should read like **Pay** or **Paystubs** / **Earnings**, not **Documents** or **Records** unless paired with a clear secondary label.
- Lead with **latest pay period**; historical periods are out of scope for v1 but leave room in IA for a later **Pay history** entry.
