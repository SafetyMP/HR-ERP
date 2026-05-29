# UK RTI transmission path — counsel gate

**Status:** Documented path; not live HMRC submission  
**Payroll math:** [uk-payroll-bootstrap.md](./uk-payroll-bootstrap.md)  
**Filing artifact:** Brief 018 UK branch in `lib/payroll/filing-artifact-uk.ts`

## Current state

HR ERP computes UK PAYE/NI bootstrap amounts and emits a **filing JSON artifact** for counsel and partner review. There is **no** live RTI (Real Time Information) submission to HMRC from this codebase.

## Target handoff path (reference customer)

```mermaid
flowchart LR
  lock[Period lock]
  artifact[UK filing JSON]
  partner[Payroll partner export]
  hmrc[HMRC via partner]
  lock --> artifact --> partner --> hmrc
```

1. HR admin locks pay period in `/hr/payroll-runs/[periodId]`.
2. System generates UK filing artifact (`buildUkFilingArtifact`).
3. Partner export connector (brief 024) delivers signed payload to configured partner endpoint.
4. **Partner** submits RTI/FPS to HMRC under their filing credentials.

## Counsel checklist before production UK tenants

| # | Item | Owner |
| --- | --- | --- |
| 1 | PAYE/NI calculation assumptions validated for pilot employers | Legal + Payroll |
| 2 | Partner is authorized RTI submitter | Legal |
| 3 | Customer understands HR ERP is not the HMRC gateway | Product + CS |
| 4 | Error correction workflow documented (amended FPS via partner) | Payroll ops |

## Explicit non-goals

- Direct HMRC API integration in Phase C
- Certified statutory table publication without counsel sign-off
- Automatic EPS/FPS submission from HR ERP workers

Revisit when a Feature brief + counsel gate approves in-app RTI or certified table releases.
