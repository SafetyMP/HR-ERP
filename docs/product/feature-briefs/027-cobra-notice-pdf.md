# Feature brief: COBRA notice PDF (counsel-gated)

**ID:** 027-cobra-notice-pdf  
**Status:** PO approved — **blocked on counsel gates 1–4**  
**Last updated:** 2026-05-30  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Benefits administrator after loss-of-coverage qualifying event |
| **Job-to-be-done** | Generate **counsel-reviewed** COBRA election notice PDF from `PENDING_NOTICE` workflow row |
| **Pain today** | Loss-of-coverage creates workflow row only; no employee-facing notice PDF |
| **Outcome** | W7 moves from workflow-only to `pdf_pilot`; honest production messaging |
| **Scope boundary** | Counsel template only; not carrier 834; not automated premium calculation |

---

## Counsel prerequisites

All required before engineering UAC closure — see [cobra-aca-counsel-gate.md](../../compliance/cobra-aca-counsel-gate.md):

1. Qualifying event definitions and notice timing approved (Legal)
2. 60-day election window calculation reviewed (Legal + Engineering)
3. 1094-C / 1095-C field mapping validated for pilot tenant
4. 834 segment rules approved per carrier (Legal + Integrations)

**Track B state:** `w7_cobra_notice_state` = `workflow_only` until gates 1–4 clear, then `pdf_pilot`.

---

## User acceptance criteria (UAC)

1. HR user opens loss-of-coverage row with status `PENDING_NOTICE` and can **Generate notice PDF**.
2. PDF uses counsel-approved template only — no ad-hoc statutory copy in code.
3. Generated PDF stored with audit hash; download link for Benefits admin.
4. Employee notification path documented (email/webhook — not in-app e-sign in v1).
5. **403** for employee-only principals on HR notice generation.
6. Playwright or integration smoke: workflow row → PDF artifact record created (staging with fixture tenant).

---

## Friction checks

- **Task-time target:** HR generates notice PDF in under 60 seconds after opening queue row.
- **Errors:** Plain language when counsel template version missing.

**Program:** [counsel-track-w3-w7.md](../counsel-track-w3-w7.md) W7 step 4.
