# Reference customer exit — customer appendix (template)

**Status:** Template — copy per customer; attach to [reference-customer-exit-runbook.md](./reference-customer-exit-runbook.md)  
**Do not commit customer PII** in the shared repo; store signed copies in customer success systems.

---

## Customer identity

| Field | Value |
| --- | --- |
| Customer legal name | |
| Tenant ID(s) in HR ERP | |
| Target exit date | |
| HR lead (signatory) | |
| Payroll lead (signatory) | |

---

## Systems cancelled (check when complete)

| System | Cancelled date | Notes |
| --- | --- | --- |
| BambooHR (or core HRIS) ESS | | Employees use `/employee/*` only |
| Payroll vendor portal (routine runs) | | Pay runs via `/hr/payroll-runs` |
| Separate ATS (if applicable) | | Managers use `/manager/recruiting` |

---

## Runbook criteria sign-off

| # | Criterion | Met (Y/N) | Evidence link |
| --- | --- | --- | --- |
| 1 | One portal ESS | | |
| 2 | Manager workforce | | |
| 3 | HR pay runs in-app | | |
| 4 | Period lock + exceptions | | |
| 5 | Partner filing handoff (not e-file) | | |
| 6 | Benefits life events | | |
| 7 | COBRA workflow start documented | | [counsel-track-w3-w7.md](./counsel-track-w3-w7.md) |
| 8 | Webhooks + workers prod | | |
| 9 | OIDC prod (no demo sign-in) | | [phase1-production-checklist.md](../operations/phase1-production-checklist.md) |
| 10 | Signed by HR + payroll leads | | This appendix |
| 11 | ESS friction scorecard green on pilot JWT | | `ess-friction-budgets.spec.ts` output |

---

## Verification commands (platform)

```bash
npm run verify:reference-exit
HR_ERP_ESS_E2E_JWT=<employee-jwt> npm run test:e2e -- tests/e2e/ess-friction-budgets.spec.ts
```

---

## Signatures

| Role | Name | Date |
| --- | --- | --- |
| Customer HR lead | | |
| Customer payroll lead | | |
| HR ERP customer success | | |
