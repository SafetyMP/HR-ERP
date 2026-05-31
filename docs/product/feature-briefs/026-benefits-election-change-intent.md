# Feature brief: Employee benefits election change intent

**ID:** 026-benefits-election-change-intent  
**Status:** PO approved  
**Last updated:** 2026-05-30  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Benefit-eligible employee outside open-enrollment self-serve portals |
| **Job-to-be-done** | Request a coverage change **in-app** so HR/Benefits can review without phone tag |
| **Pain today** | Benefits summary says “change outside this screen”; employees bounce to email/phone |
| **Outcome** | Election intents land in HR queue with category + narrative; W7 “operational” story improves |
| **Scope boundary** | Not carrier 834, not COBRA notice PDF (027), not automated plan logic — intent + queue only |

---

## Empathy / process

Employees remember they need different medical tier or dependent coverage but forget carrier portals. A short in-app intent with category + summary gives Benefits a ticket-shaped record without pretending we calculate premiums.

---

## Personas & scenarios

1. **Given** open enrollment **When** employee submits intent for medical tier change **Then** HR sees a pending request with category MEDICAL and timestamp.
2. **Given** qualifying life event approved **When** employee submits intent **Then** request references same tenant/employee and appears in HR benefits queue (019 alignment).
3. **Given** no enrollments on file **When** employee opens election change **Then** form still submits with clear “HR will contact you” copy.

---

## Prioritization rationale

Closes W7 UX gap documented in value reset; reuses `POST /api/v1/me/benefits/election-change-requests` and `/employee/benefits/election-change` (scaffold). Defers full election engine to post–reference-customer exit.

---

## User acceptance criteria (UAC)

1. Employee can open **Request election change** from `/employee/benefits` and `/employee/benefits/election-change`.
2. Form requires benefit category (medical, dental, vision, income protection, retirement) and summary (≥8 chars).
3. Successful submit shows confirmation with request id or timestamp; no silent failure.
4. HR can list pending intents via existing HR benefits APIs or queue (019/HR dashboard linkage).
5. Benefits summary page no longer instructs users to change coverage only outside the app.
6. Playwright smoke: navigate to election change, submit valid payload (with JWT), see success message.

---

## Friction checks

- **Friction budget (seconds):** 45 — open form → submit confirmation (see [ess-friction-scorecard.md](../ess-friction-scorecard.md) when promoted to top-5)
- **Task-time target:** Under 60 seconds to submit intent
- **Empty / no data state:** Explain HR follow-up if no enrollments on file
- **Errors:** Plain language; retry on 5xx

---

## Notes for Frontend

- Link from benefits summary card (implemented).
- Align terminology with Feature 003 category labels.

**Counsel:** No statutory notice content in this brief — see [counsel-track-w3-w7.md](../counsel-track-w3-w7.md) for COBRA PDF (027).
