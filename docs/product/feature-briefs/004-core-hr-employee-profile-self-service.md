# Feature brief: Employee self-service — profile & contact information

**ID:** 004-core-hr-employee-profile-self-service  
**Status:** Done  
**Last updated:** 2026-05-09  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Every employee when life changes (move, legal name, emergency contact) and **HR Operations** fixing downstream-system mismatches. |
| **Job-to-be-done** | Employee reviews **what HR has on file** for **their identity and reachability** and submits **safe, workflow-governed updates** where policy allows. |
| **Pain today** | Email and mailing address drift across payroll, IT, and benefits; HR tickets for “wrong name on badge”; emergency contacts stale for years. |
| **Outcome** | Cleaner Core HR data; fewer downstream rework loops; employees trust the **single HR profile** view. |
| **Scope boundary** (explicitly out of scope) | **Not in v1:** manager-visible performance history, compensation bands, immigration case workflow, full document vault, or unrestricted edits to tax identifiers / SSN display. |

---

## Empathy / process

Profile edits touch dignity (legal name) and safety (emergency contact). The UI must separate **read-only HR-maintained fields** from **employee-editable** fields with clear pending vs effective states when approvals exist.

---

## Personas & scenarios

1. **Given** an employee who moved **When** they update mailing address **Then** they see **confirmation that the change was submitted or saved** per policy (immediate vs pending approval).
2. **Given** HR policies restrict legal name changes **When** the employee opens profile **Then** **legal name** is readable but clearly **HR-mediated** with how to request a change.
3. **Given** IT provisioning relies on preferred name **When** employee sets preferred name **Then** it displays distinctly from **legal name** without confusing payroll tax forms wording.

---

## Prioritization rationale

Core HR data quality underpins payroll, benefits, and IT provisioning. Read-heavy profile with guarded edits is foundational before org-chart features.

---

## User acceptance criteria (UAC)

1. Employee reaches **My profile** (or equivalent) from the default employee landing path in **no more than two intentional navigational actions** after authentication.
2. The profile displays **legal name**, **preferred name** (if applicable), **work email**, **personal email** (if on file), **phone**, and **mailing address** fields consistent with **HR terminology**.
3. Fields **not editable by the employee** are visibly marked **maintained by HR** (or similar) — no fake editable controls.
4. Successful saves show **plain-language confirmation**; failures show **retry guidance** without **stack traces or internal codes**.
5. **Emergency contact** section exists with dedicated empty state when unset (explain why it matters — safety).
6. Document **task-time target** in QA scripts: first-time user can **review all sections** in **under 90 seconds** excluding network latency outside app control.

---

## Friction checks

- **Task-time target:** Full profile review **under 90 seconds** for a seeded returning user.
- **Empty / no data state:** Emergency contact unset uses supportive language.
- **Errors:** Single recovery action; optional HR inbox link — never expose raw validation dumps.

---

## Notes for Frontend

- Never surface **national IDs** in full; mask per security blueprint when displayed.
- **Primary navigation label for QA:** **My profile** (matches home CTA and page `<h1>`).
