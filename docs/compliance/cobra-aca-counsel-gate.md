# COBRA / ACA / 834 — counsel gate before production

**Status:** Blocked on Legal / benefits counsel  
**Design:** [us-benefits-cobra-aca-834.md](./us-benefits-cobra-aca-834.md)  
**Roadmap:** [specs/competitive-analysis-roadmap.md](../../specs/competitive-analysis-roadmap.md) Tier 2  
**Program:** [counsel-track-w3-w7.md](../product/counsel-track-w3-w7.md) (W7) · planned Feature brief **027** after gates 1–4

## Gate checklist (all required before employee-facing benefits admin)

| # | Item | Owner | Evidence |
| --- | --- | --- | --- |
| 1 | Qualifying event definitions and notice timing approved | Legal | Signed memo or ticket |
| 2 | 60-day election window calculation reviewed | Legal + Engineering | Test vectors in `tests/` |
| 3 | 1094-C / 1095-C field mapping validated for pilot tenant | Legal + Payroll | Sample PDF review |
| 4 | 834 segment rules (ENR/TERM) approved per carrier | Legal + Integrations | Carrier companion guide |
| 5 | Feature brief with numbered UAC filed under `docs/product/feature-briefs/` | Product | PO gate complete |
| 6 | PII / PHI classification for workflow and feeds | Security | `@cc-skill-security-review` note |

## Engineering may proceed only after gate 1–4

Until then, keep [003-benefits-enrollment-summary](../product/feature-briefs/003-benefits-enrollment-summary.md) as **read-only summary** — do not market COBRA election or carrier feeds as production-ready.
