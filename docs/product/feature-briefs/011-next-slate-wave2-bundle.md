# Feature brief: Phase 2 “next slate” bundle (011–018)

**ID:** 011-next-slate-wave2-bundle  
**Status:** Implemented  
**Last updated:** 2026-05-18  

Bundled capability set shipping together: manager leave decisions, HR case lifecycle visibility, tax/year-end summaries, benefits election intent, punch-correction proposals, onboarding templates + apply API, separation/offboarding tasks, organization context.

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Employees (self‑service), people managers (direct reports), HR operations |
| **Job-to-be-done** | Complete common HR workflows without email/ping‑pong; keep approvals auditable |
| **Pain today** | Opaque HR ticket status; managers lack tooling for leave/punches; exits lack mirrored onboarding ergonomics |
| **Outcome** (time, risk, errors) | Fewer mistaken punches/payout surprises; faster triage; tenant‑scoped APIs |
| **Scope boundary** (explicitly out of scope) | Full ticketing/CMS; jurisdictional tax filing delivery; payroll recomputation from intents |

---

## Empathy / process

Employees need dignity on exits and clarity when HR needs information. Managers must not feel like “shadow payroll.” HR needs queues that separate intake noise from punch corrections without merging incompatible workflows.

---

## Personas & scenarios

1. **Given** an employee with pending separation tasks **when** they open Leaving checklist **then** they see ordered tasks and can advance status along PENDING → IN_PROGRESS → DONE.  
2. **Given** a manager **when** they review direct‑report leave **then** they can approve/deny with audit‑friendly persistence visible on employee PTO.  
3. **Given** HR **when** they open Review queue **then** they see pending HR cases and pending punch‑correction proposals and can resolve with employee‑visible notes or approve/deny corrections.

---

## Prioritization rationale

These workflows unblock demos aligned with Phase 1 single‑DB posture while preserving logical separation for future extraction.

---

## User acceptance criteria (UAC)

**Manager leave (011)**  
1. Authenticated manager can list pending multi‑day time‑off requests for direct reports.  
2. Manager can approve or deny a pending request; decision persists and surfaces on employee views where implemented.

**HR case lifecycle (012)**  
3. Employee can list own HR case requests with status and HR‑visible/employee‑visible notes fields surfaced appropriately.  
4. HR can list pending cases and update status including NEEDS_INFO / RESOLVED with optional employee‑visible note.

**Tax / year‑end summaries (013)**  
5. Employee can load tax document summary rows for the authenticated tenant when seeded/metadata exists.

**Benefits election intent (014)**  
6. Employee can submit a benefits election change intent payload accepted by API validation rules.

**Punch corrections (015)**  
7. Manager can submit an attendance correction proposal for a report’s punch with datetime + reason.  
8. HR can list pending correction proposals and approve or deny each.

**Onboarding templates (016)**  
9. HR can list onboarding templates for the tenant.  
10. HR can apply a template to an employee UUID; duplicate onboarding titles are skipped.

**Separation tasks (017)**  
11. Employee can list separation tasks and PATCH status forward only along the allowed ladder.

**Organization context (018)**  
12. Employee can retrieve organization context including manager chain, peers, and department metadata where modeled.

---

## Friction checks

- **Task-time target:** Manager approve/deny and HR patch flows actionable under ~60 seconds once authenticated.  
- **Empty / no data state:** Employee separation shows explanatory empty copy when no tasks.  
- **Errors:** Plain language retries where loads fail; 403 paths explained for wrong persona tokens.

---

## Notes for Frontend

Home hub links route to `/employee/leaving`, `/hr/onboarding-templates`, `/manager/team-leave`, `/manager/punch-corrections`, `/hr/review-queue`, `/employee/tax-documents`, `/employee/organization`, `/employee/benefits/election-change`.
