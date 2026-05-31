# Reference customer exit — pilot execution checklist

**Status:** Active  
**Parent:** [reference-customer-exit-runbook.md](./reference-customer-exit-runbook.md)  
**Appendix:** [reference-customer-exit-appendix-template.md](./reference-customer-exit-appendix-template.md)

Use this checklist when walking a **pilot reference customer** through Phase B exit. Store signed appendix outside the repo (customer success system).

---

## Pre-flight (platform)

| Step | Command / artifact | Owner |
| --- | --- | --- |
| 1 | `npm run verify:reference-exit` — all artifacts present | Engineering |
| 2 | Production env: no `NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN` | Security |
| 3 | OIDC/Neon per [phase1-production-checklist.md](../operations/phase1-production-checklist.md) | Platform |
| 4 | Workers: `worker:webhooks`, `worker:integrations` running | Platform |
| 5 | ESS friction (optional gate): `HR_ERP_ESS_E2E_JWT=… npm run test:e2e -- tests/e2e/ess-friction-budgets.spec.ts` | QA |

---

## Customer walkthrough (1–2 sessions)

### Session A — Employee self-service (cancel BambooHR ESS)

| # | Demo path | Success signal |
| --- | --- | --- |
| 1 | `/employee/paystub` | Current earnings statement visible ≤10s budget |
| 2 | `/employee/time` | Clock status copy visible |
| 3 | `/employee/pto` | PTO balance + recorded list |
| 4 | `/employee/profile` | Identity + mailing sections |
| 5 | `/employee/benefits` | Enrollments + **Request election change** (026) |
| 6 | `/employee/benefits/life-events` | Submit / track life event |
| 7 | `/employee/learning` | Enrollments list |

### Session B — Payroll + HR ops (cancel payroll vendor portal)

| # | Demo path | Success signal |
| --- | --- | --- |
| 1 | `/hr/payroll-runs` | Create / list pay runs |
| 2 | Period detail | Exceptions visible |
| 3 | Lock period | Status → LOCKED |
| 4 | Filing artifact + partner export | JSON download (018 + 024) |
| 5 | `/hr/dashboard` | Ops summary loads; election intents + life events counts |
| 6 | `/manager/recruiting` | Pipeline through offer |

---

## Sign-off

1. Copy [reference-customer-exit-appendix-template.md](./reference-customer-exit-appendix-template.md) per customer.
2. Mark runbook criteria 1–10 Y/N with evidence links.
3. Obtain HR lead + payroll lead signatures.
4. Record in Track B OKR: reference exit signed.

---

## Explicit non-claims during pilot

- No live IRS/HMRC e-file (partner handoff only — W3 Partial until counsel signoff).
- No COBRA notice PDF (workflow start only — W7 Partial until 027).
- No Track D surfaces in buyer script ([deferred-platform-track.md](./deferred-platform-track.md)).
