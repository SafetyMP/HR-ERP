# Feature brief: Payroll operations — pay run console

**ID:** 016-payroll-operations-pay-run-console  
**Status:** PO approved  
**Last updated:** 2026-05-18  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Payroll administrator or HR/payroll operations lead running periodic pay. |
| **Job-to-be-done** | **List payroll periods**, **trigger a pay run** for a period, and **review per-employee outcomes** (computed, skipped, errors) without SQL or scripts. |
| **Pain today** | `POST|GET /api/v1/payroll/runs` exists; no operations UI; trust gap vs Workday/UKG pay run control centers. |
| **Outcome** | Auditable, repeatable pay runs from the product; faster reconciliation when kernel skips employees. |
| **Scope boundary** (explicitly out of scope) | Check printing, ACH/NACHA files, tax filing submission, automatic reversal workflows, multi-country pay run orchestration UI, statutory table editing UI. |

---

## Empathy / process

Payroll operations live under deadline pressure. The console must show **what ran**, **who was skipped**, and **why** (no compensation, already computed) in payroll language—not developer codes.

---

## Personas & scenarios

1. **Given** a finalized payroll period **when** payroll admin opens **Pay runs** **then** they see period dates and prior run summaries if any.
2. **Given** a period **when** admin starts a run **then** `POST /api/v1/payroll/runs` executes and UI shows counts: computed, skipped, without compensation.

---

## Prioritization rationale

Thin UI on existing `runPayroll` orchestration—high buyer trust, minimal schema change. Pairs with compliance spikes (withholding, OT wire) without blocking on them.

---

## User acceptance criteria (UAC)

1. Payroll-authorized user opens **Pay runs** from home or HR section in **≤2 intentional navigational actions** (`/hr/payroll-runs` or equivalent).
2. UI lists payroll periods via `GET /api/v1/payroll/runs` with **period start/end**, **currency**, and summary counts when available.
3. User can **start a pay run** for a selected period via `POST /api/v1/payroll/runs` with `payrollPeriodId`; success shows **computed / skipped / without compensation** totals from response body.
4. User can open **period detail** via `GET /api/v1/payroll/runs/{periodId}` showing per-employee rows (employee id or display label, status, net pay when computed).
5. **Reissue** toggle (when exposed) passes `reissue: true` only with explicit confirmation copy warning prior instructions may be replaced.
6. **403** for principals without payroll run permission—plain language, no internal codes.
7. Recoverable load failures offer **retry**; no stack traces in UI.

---

## Friction checks

- **Task-time target:** Admin identifies whether a period has been run in **under 20 seconds** after page load.
- **Empty / no data state:** Explains no payroll periods configured; points to seed/bootstrap in dev.
- **Errors:** Distinguish validation (bad period) from system failure.

---

## Notes for Frontend

- Route under **HR** namespace: `/hr/payroll-runs`, `/hr/payroll-runs/[periodId]`.
- Use `hrApiFetch` with role that has `payroll:run` (or documented permission from route policy).
- Display **inputs fingerprint** only in collapsed “technical detail” for support—not primary IA.

## API references (existing)

- `GET|POST /api/v1/payroll/runs`
- `GET /api/v1/payroll/runs/{periodId}`
