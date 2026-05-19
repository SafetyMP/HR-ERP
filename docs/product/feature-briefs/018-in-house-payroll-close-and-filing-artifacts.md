# Feature brief: In-house payroll close and filing artifacts

**ID:** 018-in-house-payroll-close-and-filing-artifacts  
**Status:** PO approved  
**Last updated:** 2026-05-18  

## PO gate (required before Engineering)

| Item | Answer |
|------|--------|
| **Primary user / persona** | Payroll administrator closing a period and preparing statutory filing packages. |
| **Job-to-be-done** | **Lock** a computed pay period, **resolve exceptions** (no compensation, skips), and **generate an in-house filing artifact** from the same payment instructions—without a separate payroll vendor portal. |
| **Pain today** | Feature 016 runs pay but has no period status, exception queue, or filing package; admins reconcile in spreadsheets or ADP. |
| **Outcome** | Auditable period close; fewer “did we run everyone?” incidents; counsel-reviewable filing JSON from kernel fingerprints. |
| **Scope boundary** (explicitly out of scope) | IRS/HMRC **live e-file transmission**, Gusto/ADP embed, ACH/NACHA, check printing, period unlock without ADR. |

---

## Empathy / process

Close week is high stakes. Exceptions must read in HR language (“No compensation on file”) not `no_compensation`. Locking a period must feel deliberate; filing artifact copy must state it is **not** agency-submitted until Legal approves.

---

## Prioritization rationale

Beats stitched-stack goal W2/W3: native close + policy replay on same rows as paystub. Builds on 016 without partner APIs (in-house stack).

---

## User acceptance criteria (UAC)

1. Payroll-authorized user opens period detail and sees **period status** (`OPEN`, `COMPUTED`, `LOCKED`, `ARTIFACT_GENERATED`).
2. After a pay run, **exceptions** list shows employees with `no_compensation` or other codes via `GET .../exceptions`.
3. User can **resolve or waive** an exception with a note via `PATCH .../exceptions/{id}`.
4. User can **lock** a period via `POST .../lock`; further pay runs for that period are rejected with plain language.
5. User can **generate filing artifact** via `POST .../filing-artifact`; response includes jurisdiction, policy version ids, and payload hash.
6. User can **download** artifact JSON from `GET .../filing-artifact`.
7. **403** without `payroll:run_execute` / read permissions—plain language.
8. Load failures offer **retry** without stack traces.

---

## Friction checks

- **Task-time target:** Open exceptions for a period in **under 15 seconds** after page load.
- **Errors:** Distinguish locked period vs validation vs system failure.

---

## API references

- `GET /api/v1/payroll/runs/{periodId}/exceptions`
- `PATCH /api/v1/payroll/runs/exceptions/{id}`
- `POST /api/v1/payroll/runs/{periodId}/lock`
- `POST|GET /api/v1/payroll/runs/{periodId}/filing-artifact`
