# Feature brief: Employee self-service — benefits enrollment summary

**ID:** 003-benefits-enrollment-summary  
**Status:** PO approved  
**Last updated:** 2026-05-09  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Benefit-eligible employee during **open enrollment** and overstretched **Benefits Administrator** answering “what did I elect?” |
| **Job-to-be-done** | Employee sees **current benefit elections at a glance** (medical tier, dependents count, effective dates) without PDF hunting. |
| **Pain today** | Confirmation emails are lost; portals differ by carrier; calls spike during enrollment windows; new hires don’t know what is active. |
| **Outcome** | Enrollment-related inquiries drop; employees confirm elections before payroll deductions change; fewer correction events after enrollment closes. |
| **Scope boundary** (explicitly out of scope) | **Not in v1:** changing elections, life-event workflows, COBRA administration, carrier invoicing reconciliation, or personalized premium dollar projections across every jurisdiction. |

---

## Empathy / process

Open enrollment is confusing by design — HDHP vs PPO, deductibles, networks. The product cannot replace counsel, but it **must** show **what is currently elected** in calm, scan-friendly language so employees screenshot something credible for their household.

---

## Personas & scenarios

1. **Given** open enrollment week **When** an employee opens Benefits **Then** they see **each enrolled benefit category** with **plan name or tier** and **effective date**.
2. **Given** a new hire after waiting period **When** they view benefits **Then** **effective dates** reflect eligibility rules without exposing internal rule engine IDs.
3. **Given** Legal asks for employee-visible transparency **When** they view the summary **Then** terminology matches common **benefits / payroll deduction** language (medical, dental, vision, retirement deferral % if applicable).

---

## Prioritization rationale

Benefits noise scales with headcount. A read-only enrollment summary is high empathy per engineering unit and pairs with future deduction explanations on the paystub (Feature 001).

---

## User acceptance criteria (UAC)

1. After authentication, the employee opens **current benefits summary** within **two intentional navigational actions** from the default landing experience focused on employees.
2. The summary lists **each active benefit enrollment** with **human-readable plan or tier labels** (not raw carrier codes alone).
3. **Effective dates** are visible for each listed enrollment where applicable.
4. If the employee has **no enrollments on file**, the UI shows a **dedicated empty state** with guidance (e.g. contact Benefits during enrollment) — no blank screen.
5. On load failure, show **plain-language retry guidance** with **no stack traces or internal error codes** exposed to the employee.
6. **Navigation labels** use consistent benefits wording (**Benefits** or **Coverage** — pick one primary term per locale and document for QA).

---

## Friction checks

- **Task-time target:** Answer “what medical plan am I in?” in **under 45 seconds** after login for returning users.
- **Empty / no data state:** enrollment windows + who to contact; avoid implying the employee did something wrong.
- **Errors:** Retry path plus optional link to **Benefits** contact channel.

---

## Notes for Frontend

- Prefer grouping by **Medical**, **Dental**, **Vision**, **Income protection**, **Retirement** — collapse advanced riders behind disclosure.
