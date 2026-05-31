# Completion audit — Feature 028 (partner filing UX)

**Audit date:** 2026-05-30  
**Denominator:** 8 numbered UAC  
**Result:** **8 / 8 Met** (engineering + E2E smoke)

Evidence: [`hr-payroll-period-client.tsx`](../../src/app/hr/payroll-runs/[periodId]/hr-payroll-period-client.tsx), `tests/e2e/partner-filing-feature-028.spec.ts`.

---

## 028 — Partner filing UX and counsel package (W3)

| UAC | Met | Evidence |
| --- | --- | --- |
| 1 | Y | **Export for partner** primary button on locked period close step |
| 2 | Y | Alert copy: partner handoff, not agency e-file |
| 3 | Y | Confirmation panel: jurisdiction, policy release (versionId), payload hash |
| 4 | Y | Partner export POST enqueues integration job (existing 024 path) |
| 5 | Y | Counsel withholding checklist link in close flow |
| 6 | Y | 403 plain language in export handler |
| 7 | Y | Distinct errors: locked, artifact-missing, partner-not-configured |
| 8 | Y | Playwright smoke: period detail shows Export for partner |

---

## Notes

- W3 counsel signoff date still pending Legal — UX does not claim IRS/HMRC certified e-file.
- Program: [counsel-track-w3-w7.md](../counsel-track-w3-w7.md) W3 step 4.
