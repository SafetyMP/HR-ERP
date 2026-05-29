# Reference customer exit — validation audit

**Date:** 2026-05-28  
**Runbook:** [reference-customer-exit-runbook.md](../reference-customer-exit-runbook.md)  
**Verifier:** `npm run verify:reference-exit`

## Result

| # | Exit criterion | Verified | Evidence |
| --- | --- | --- | --- |
| 1 | Employee ESS portal (pay, time, PTO, profile, benefits, learning) | **Yes** | `/employee/*` routes + `/api/v1/me/*` APIs |
| 2 | Manager workforce without third ATS | **Yes** | `/manager/recruiting`, briefs 014–020 |
| 3 | HR pay periods in-app | **Yes** | `/hr/payroll-runs`, `POST /api/v1/payroll/runs` |
| 4 | Period lock + exception queue | **Yes** | Brief 018 APIs + UI |
| 5 | Filing handoff to partner | **Yes** | Filing artifact + `POST .../partner-export` (brief 024) |
| 6 | Benefits life events | **Yes** | Brief 019 routes |
| 7 | COBRA workflow start | **Yes** | `PENDING_NOTICE` on loss-of-coverage; notice PDF counsel-gated |
| 8 | Webhooks + workers | **Yes** | ADR 0008 + worker scripts |
| 9 | OIDC production auth | **Documented** | [phase1-production-checklist.md](../../operations/phase1-production-checklist.md) |
| 10 | Customer sign-off template | **Yes** | Runbook § Customer sign-off |

## Automated check

```bash
npm run verify:reference-exit
```

Static file/route presence — does not substitute for E2E or production smoke.

## Remaining counsel gates

- Partner transmission: [filing-partner-transmission-gate.md](../../compliance/filing-partner-transmission-gate.md)
- COBRA notice PDF: [cobra-aca-counsel-gate.md](../../compliance/cobra-aca-counsel-gate.md)
- UK RTI path: [uk-rti-transmission-path.md](../../compliance/uk-rti-transmission-path.md)
