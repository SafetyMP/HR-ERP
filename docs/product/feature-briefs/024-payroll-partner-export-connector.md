# Feature brief: Payroll partner export connector

**ID:** 024-payroll-partner-export-connector  
**Status:** PO approved  
**Last updated:** 2026-05-28  

## PO gate

| Item | Answer |
|------|--------|
| **Primary user / persona** | Payroll manager handing off filing to ADP/Gusto/partner after in-app close |
| **Job-to-be-done** | Export 018 filing JSON artifact + payment summary to partner without CSV re-keying |
| **Pain today** | Filing artifact exists in-app; partner handoff is manual download + email |
| **Outcome** | W6 connector #2; reference customer exit filing step uses curated export |
| **Scope boundary** | No live IRS/HMRC e-file; partner validates format; no bidirectional pay import v1 |

## User acceptance criteria (UAC)

1. After period lock, HR admin can trigger **partner export** from period detail UI or API.
2. Export payload includes filing artifact JSON + checksum from brief 018.
3. Export is idempotent (same period + partner config → same export ID).
4. Webhook `payroll.period.locked` fires before export eligibility (ADR 0008).
5. Partner credentials stored encrypted; `integrations:configure` ABAC only.
6. Failed export surfaces retry + DLQ entry in integration worker logs.
7. Runbook documents partner handoff SLA and counsel transmission gate.

## Friction checks

- Export trigger ≤3 clicks from locked period detail.

## Stitched-stack pain row

| Pain | Outcome | UAC |
| --- | --- | --- |
| Payroll admin re-keys totals into ADP after every close | One-click partner export from `/hr/payroll-runs/[periodId]` | 1, 2 |

## Dependencies

- Brief [018](./018-in-house-payroll-close-and-filing-artifacts.md)
- [reference-customer-exit-runbook.md](../reference-customer-exit-runbook.md)
