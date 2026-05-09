# Feature brief: Employee self-service — time & attendance (clock confirmation)

**ID:** 002-time-attendance-self-service  
**Status:** Done  
**Last updated:** 2026-05-09  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Non-exempt hourly employee and Payroll Specialist tired of disputing “did you clock in?” |
| **Job-to-be-done** | Employee confirms their **last punch / clock-in** was recorded correctly without opening a ticket; Payroll reduces rework from missing punches. |
| **Pain today** | Employees forget whether they clocked; supervisors chase screenshots; duplicate punches or gaps surface only at payroll close. |
| **Outcome** | Fewer payroll adjustments; employees trust time capture in under one minute; audit-friendly visibility of **their own** punches only. |
| **Scope boundary** (explicitly out of scope) | **Not in v1:** manager approvals, schedule editing, geofence rules, break meal compliance logic, union premium allocation, or bulk HR admin corrections. |

---

## Empathy / process

Clocking in is often rushed — parking lot, badge reader, phone unlock. The UI must reassure (“You’re clocked in”) without burying the timestamp or location policy in jargon. Disputes spike when the product feels like a black hole.

---

## Personas & scenarios

1. **Given** a retail associate mid-shift **When** they check attendance **Then** they see **today’s latest punch time** in plain language.
2. **Given** an employee who fears a missed punch **When** they open attendance **Then** they see **whether they are currently clocked in** or need to punch (aligned with org policy messaging).
3. **Given** Payroll is auditing time **When** an employee views their punch **Then** labels use **standard wage-and-hour terms** (clock-in, punch time), not internal IDs.

---

## Prioritization rationale

Time capture is adjacent to pay accuracy (Feature 001). Productizing the existing demo clock-in API into a discoverable employee flow reduces payroll churn before deeper scheduling investment.

---

## User acceptance criteria (UAC)

1. From the employee home or primary dashboard, the worker reaches **today’s attendance summary** in **no more than two intentional navigational actions** (excluding authentication).
2. The view shows **whether the employee has an active clock-in** for today (or explicit **not clocked in** state) using **standard time-and-attendance wording**.
3. If **no punches exist yet today**, the UI shows a **dedicated empty state** explaining what to do next (e.g. clock in) without blaming the user.
4. If punch data cannot load, the employee sees **recoverable guidance** (retry) with **no stack traces, raw database messages, or technical error codes**.
5. Navigation and page headings consistently use either **Time** or **Attendance** as the primary term (document the chosen term for QA per locale).
6. The flow meets the brief’s **task-time target** below when measured with the standardized QA script for this feature.

---

## Friction checks

- **Task-time target:** Confirm clock status / last punch in **under one minute** after landing post-login.
- **Empty / no data state:** Explains first punch of the day without implying fault.
- **Errors:** One sentence + single primary action (**Retry** or **Contact Payroll**).

---

## Notes for Frontend

- Pair **Time** nav entry with sub-label **Clock** if the org uses “punch” colloquially — avoid mixing three synonyms in one screen.
- **Release QA label:** primary nav and `<h1>` use **Time**; subtitle **Clock** where shown.
