# Deferred platform track

Routes and surfaces that support demos, QA, or architecture previews but are **not** Track A Feature UAC closure.

**Forward plan:** [stakeholder-value-plan.md](./stakeholder-value-plan.md)

## Demo / mock API gates

- `src/app/api/mock/*` — blocked in production unless `ALLOW_DEMO_API_ROUTES=1`
- `src/app/api/global-l10n/*` — requires bearer auth in non-production; blocked in production unless `ALLOW_DEMO_API_ROUTES=1`
- `src/app/demo/*` — UI demos; do not enable production sign-in shortcuts (`NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN`)

## Bounded-context extraction

- Payroll DB: [ADR 0012](../../specs/alignment/decisions/0012-payroll-db-extraction.md) — ports scaffold only; cutover after reference customer exit
- Core HR template: [ADR 0013](../../specs/alignment/decisions/0013-core-hr-extraction-template.md) — **Proposed**; not funded

## Track D — API scaffold (no Feature brief)

Code exists; **not** counted in Track A UAC or buyer-facing inventory until brief **023+** or explicit PO scope.

| Surface | Routes | Status |
| --- | --- | --- |
| Compensation cycles | `/api/v1/compensation/*` | Deferred — no brief |
| Workflow engine | `/api/v1/workflow/*` | Deferred — no brief |
| Engagement / eNPS | `/api/v1/engagement/*`, `/me/engagement/responses` | Deferred — no brief |
| Positions | `POST /api/v1/positions` | Deferred — no brief |
| Analytics / churn ML | `/analytics/*`, `/api/v1/analytics/*`, `/api/v1/ml/churn/*` | Demo-only; block prod ML until governance exit |
| AI governance proposals | `/api/governance/proposals` | Platform / governance |
| Mock / global-l10n / examples | existing gates above | Demo only |

## Archived future-platform docs

Edge/pgvector, Wasm/Rust, PQC, ML rollout sequence, multi-country payroll roadmap, vendor connector RFC draft:

[docs/_archived/planning/2026-05-28-stakeholder-reset/future-platform/](../_archived/planning/2026-05-28-stakeholder-reset/future-platform/)
