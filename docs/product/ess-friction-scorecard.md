# ESS friction scorecard (top-5 employee tasks)

**Status:** Active  
**Audience:** Product Owner, QA, Engineering  
**PO bar:** [hr-product-owner-operating-model.md](./hr-product-owner-operating-model.md) — primary employee tasks target **≤10 seconds** discoverability + completion on a clean device (excluding external network latency).

**Automation:** [`tests/e2e/ess-friction-budgets.spec.ts`](../../tests/e2e/ess-friction-budgets.spec.ts) enforces budgets when `HR_ERP_ESS_E2E_JWT` is set (demo employee JWT).

---

## Scorecard

| # | Task | Persona | Start | Success signal | Budget (ms) | Feature brief | E2E |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| 1 | View current earnings statement | Employee | Home signed in | Heading “Current earnings statement” visible | **10,000** | [001](./feature-briefs/001-employee-paystub-self-service.md) | `paystub-feature-001` |
| 2 | See today’s clock status | Employee | Home signed in | Clocked-in / not clocked-in / no punches copy | **60,000** | [002](./feature-briefs/002-time-attendance-self-service.md) | `time-attendance-feature-002` |
| 3 | View PTO balance + recorded time off | Employee | Home signed in | “Your PTO” + balance + recorded list | **60,000** | [005](./feature-briefs/005-pto-balance-and-recorded-time-off.md) | `pto-feature-005` |
| 4 | Review profile sections | Employee | Home signed in | Identity, mailing, emergency headings | **90,000** | [004](./feature-briefs/004-employee-profile-self-service.md) | `profile-feature-004` |
| 5 | View benefits enrollments | Employee | Home signed in | “Your enrollments” + plan row or empty state | **45,000** | [003](./feature-briefs/003-benefits-enrollment-summary.md) | `benefits-feature-003` |

**Notes:**

- Budgets measure **in-app** navigation from home → task complete (Playwright `Date.now()` delta), not cold DNS/TLS.
- Paystub (10s) is the strictest bar per PO operating model; others use feature-brief friction checks until tightened.
- Failures are **PO defects** if UAC passes but budget fails — reopen IA, loading pattern, or API latency.

---

## JWT setup (one token for all ESS friction tests)

```bash
npm run demo:bootstrap
DEV_TENANT_ID=default-tenant \
DEV_ROLES=employee \
DEV_SUBJECT_EMPLOYEE_ID=b0000001-0001-4000-8000-000000000011 \
node scripts/issue-dev-jwt.mjs
```

```bash
HR_ERP_ESS_E2E_JWT=<token> npm run test:e2e -- tests/e2e/ess-friction-budgets.spec.ts
```

Per-feature env vars (`HR_ERP_PAYSTUB_E2E_JWT`, etc.) remain supported in individual specs.

---

## Remediation triggers

| Signal | Action |
| --- | --- |
| Paystub >10s | Prefer RSC prefetch + `useCurrentPaystubQuery`; audit paystub API p95 (`ess_api_timing` logs when >300ms) |
| Benefits/PTO/Time > budget | Migrate client to `useAuthenticatedResource`; dedupe waterfall fetches; RSC prefetch on employee pages |
| Profile >90s | Reduce section count above fold or server-prefetch profile GET |

**Related:** [codebase-completion-baseline.md](./codebase-completion-baseline.md) Track B buyer-ready OKRs in [stakeholder-value-plan.md](./stakeholder-value-plan.md).
