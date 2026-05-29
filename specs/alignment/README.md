# Vision alignment

When Architecture, Security, Integrations, QA, or Legal-process guidance **conflicts**:

1. Do **not** merge contradictory instructions into a single spec.  
2. Open a new markdown file in `decisions/` using `adr-template.md`.  
3. Link that ADR from every affected spec + PR description.  
4. **Revisit when:** ADR must name a concrete trigger (scale, second service, regulatory change), not “later maybe.”

**Orchestrator** keeps `specs/alignment/decisions/` the single source for phase topology and governance ADRs ([0010](decisions/0010-agent-risk-tier-governance.md), [0011](decisions/0011-function-lane-orchestration.md)). **Step 1 — PO gate** via `@hr-product-gate`; then **function-lane DAG** per [`.cursor/rules/orchestrator.mdc`](../../.cursor/rules/orchestrator.mdc) (not a linear Arch→Legal→Impl waterfall).

**Competitive / operate TCO:** [Competitive analysis & roadmap](../competitive-analysis-roadmap.md) (parity matrix, funding tiers); executive brief and TCO worksheet under [`docs/product/`](../docs/product/).

## Conflict log (optional table in PR)

| Topic | Agent A | Agent B | Resolution ADR |
| --- | --- | --- | --- |
