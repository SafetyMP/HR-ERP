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

## Track D — API scaffold (no Feature brief) — **quarantined in production**

**PO decision (2026-05-30):** Quarantine until brief **029** funds one surface or code is removed. Production returns **404** `track_d_api_not_shipped` unless `TRACK_D_API_ENABLED=1` (Human authorization). **Decision record:** [track-d-po-decision.md](./track-d-po-decision.md) — remain quarantined; Brief 029 not funded.

Implementation: [`lib/api/v1/track-d-guard.ts`](../../lib/api/v1/track-d-guard.ts) at route entry.

| Surface | Routes | Status |
| --- | --- | --- |
| Compensation cycles | `/api/v1/compensation/*` | Quarantined — no brief |
| Workflow engine | `/api/v1/workflow/*` | Quarantined — no brief |
| Engagement / eNPS | `/api/v1/engagement/*`, `/me/engagement/responses` | Quarantined — no brief |
| Positions | `POST /api/v1/positions` | Quarantined — no brief |
| Analytics / churn ML | `/analytics/*`, `/api/v1/analytics/*`, `/api/v1/ml/churn/*` | Demo-only; block prod ML until governance exit |
| AI governance proposals | `/api/governance/proposals` | Platform / governance |
| Mock / global-l10n / examples | existing gates above | Demo only |

**Buyer/demo rule:** Do not list Track D in buyer inventory. Demo script: [ess-friction-scorecard.md](./ess-friction-scorecard.md) + W1–W5 paths only.

## Funded product backlog (Track A extension)

| Brief | Theme | Status |
| --- | --- | --- |
| [026](./feature-briefs/026-benefits-election-change-intent.md) | In-app election change intent | **Shipped** — [audit](./completion-audits/features-026.md) |
| [027](./feature-briefs/027-cobra-notice-pdf.md) | COBRA notice PDF | **Blocked (counsel)** — [audit](./completion-audits/features-027.md) |
| [028](./feature-briefs/028-partner-filing-ux-counsel-package.md) | Partner filing UX + counsel package (W3) | **Shipped** — [audit](./completion-audits/features-028.md) |
| 029 (optional) | Promote **one** Track D surface with UAC or delete scaffold | **Deferred** — [track-d-po-decision.md](./track-d-po-decision.md) |

## Archived future-platform docs

Edge/pgvector, Wasm/Rust, PQC, ML rollout sequence, multi-country payroll roadmap, vendor connector RFC draft:

[docs/_archived/planning/2026-05-28-stakeholder-reset/future-platform/](../_archived/planning/2026-05-28-stakeholder-reset/future-platform/)
