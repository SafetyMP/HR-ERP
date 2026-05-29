# Reference customer exit runbook

**Status:** Active  
**Goal:** Phase B exit from [goal-beat-bamboohr-plus-payroll-stack.md](./goal-beat-bamboohr-plus-payroll-stack.md)  
**Audience:** Customer success, HR/payroll ops, platform engineering, counsel

A reference customer can **cancel BambooHR + separate payroll vendor portal access** for employee self-service and **routine pay runs**, with filing still via a **partner** (not live IRS/HMRC e-file).

---

## Exit criteria checklist

| # | Criterion | Route / artifact | Owner | Counsel? |
| --- | --- | --- | --- | --- |
| 1 | Employees access pay, time, PTO, profile, benefits, learning in one portal | `/employee/*`, briefs 001–007, 017, 022 shell | Product | No |
| 2 | Managers run workforce without third ATS for standard reqs | `/manager/recruiting`, `/manager/team-attendance`, 014–020 | Product | No |
| 3 | HR runs pay periods in-app | `/hr/payroll-runs`, `/hr/payroll-runs/[periodId]` | Payroll ops | No |
| 4 | Period lock + exception queue operational | `POST .../lock`, exception APIs, brief 018 | Payroll ops | No |
| 5 | Filing handoff to partner (not agency e-file) | 018 JSON filing artifact export | Payroll ops + partner | **Yes** — transmission |
| 6 | Benefits life events beyond summary | `/employee/benefits/life-events`, `/hr/benefits/life-events` | Benefits admin | Partial |
| 7 | COBRA workflow **start** documented | `PENDING_NOTICE` row on loss-of-coverage | Benefits + counsel | **Yes** — [cobra-aca-counsel-gate](../compliance/cobra-aca-counsel-gate.md) |
| 8 | Webhooks + workers running in prod | `npm run worker:webhooks`, `worker:integrations` | Platform | No |
| 9 | OIDC/Neon production auth (no demo sign-in) | Production env checklist | Security | No |
| 10 | Written runbook signed by customer HR + payroll lead | This document + customer-specific appendix | CS | No |

---

## Employee self-service (cancel BambooHR ESS)

| Capability | URL | API | Brief |
| --- | --- | --- | --- |
| Current paystub | `/employee/paystub` | `GET /api/v1/me/paystub/current` | 001 |
| Pay history | `/employee/paystub/history` | `GET /api/v1/me/paystub/history` | 007 |
| Time clock | `/employee/time` | `/me/attendance/*` | 002 |
| PTO | `/employee/pto` | `/me/pto/summary` | 005 |
| Profile | `/employee/profile` | `/me/profile` | 004 |
| Benefits | `/employee/benefits` | `/me/benefits/summary` | 003 |
| Life events | `/employee/benefits/life-events` | life-events CRUD | 019 |
| Learning | `/employee/learning` | `/me/learning/enrollments` | 017 |

**Shell:** Feature 022 — persistent nav on all `/employee/*` routes.

---

## Payroll operations (cancel payroll vendor portal for routine runs)

| Step | Action | Evidence |
| --- | --- | --- |
| 1 | Create / list pay runs | `/hr/payroll-runs`, `POST /api/v1/payroll/runs` | 016 |
| 2 | Review period detail | `/hr/payroll-runs/[periodId]` | 016, 018 |
| 3 | Resolve exceptions | Exception queue APIs | 018 |
| 4 | Lock period | `POST .../lock` | 018 |
| 5 | Export filing artifact | Filing JSON download (partner handoff) | 018 |
| 6 | Employee paystub reflects same `PaymentInstruction` rows | Cross-check 001 vs 016 | W2 |

**Not in scope for exit:** IRS/HMRC live e-file, certified statutory tables, W-2 PDF delivery to employees.

**Counsel gates:** [us-federal-withholding-placeholder.md](../compliance/us-federal-withholding-placeholder.md), [uk-payroll-bootstrap.md](../compliance/uk-payroll-bootstrap.md).

---

## Benefits operations

| Capability | Status | Gap |
| --- | --- | --- |
| Enrollment summary | Shipped (003) | — |
| Life event submit + HR queue | Shipped (019) | — |
| COBRA notice PDF | **Not shipped** | Counsel gate — workflow creates `PENDING_NOTICE` only |
| Carrier 834 | **Deferred** | Brief 025 outbound stub; full 834 Phase C+ |

---

## Integrations required for exit

| Integration | Status | Runbook |
| --- | --- | --- |
| Outbound webhooks | Shipped (ADR 0008) | Run `worker:webhooks`; verify HMAC + encryption |
| SCIM provisioning | API substantial | Brief **023** for production hardening |
| Payroll partner export | Partial (018 JSON) | Brief **024** for curated connector |
| IdP (OIDC) | Production path documented | [phase1-production-checklist.md](../operations/phase1-production-checklist.md) |

---

## Production checklist (platform)

From [phase1-production-checklist.md](../operations/phase1-production-checklist.md):

1. `DATABASE_URL`, `JWT_SECRET`, Redis for workers
2. **Never** set `NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN` in production
3. **Never** set `ALLOW_DEMO_API_ROUTES=1` in production
4. `npm run db:migrate:deploy` + `npm run db:verify`
5. Workers: `worker:webhooks`, `worker:integrations`

---

## Customer sign-off template

| Role | Sign-off | Date |
| --- | --- | --- |
| HR Director | ESS + life events acceptable for go-live | |
| Payroll Manager | Pay runs + lock + partner filing handoff acceptable | |
| IT / Security | OIDC, SCIM, webhooks reviewed | |
| Counsel | Filing transmission + COBRA start path acknowledged | |

---

## Related

- [stakeholder-value-plan.md](./stakeholder-value-plan.md)
- [completion-audits/features-018-021.md](./completion-audits/features-018-021.md)
- Feature briefs [018](./feature-briefs/018-in-house-payroll-close-and-filing-artifacts.md)–[021](./feature-briefs/021-hr-ops-dashboards.md)
