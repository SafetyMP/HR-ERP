# Governance references (in-repo canon)

## ADR index (0000–0014)

| ID | Decision |
| --- | --- |
| 0000 | ADR process template |
| 0001 | [Phase 1 scope — single app, single Postgres](decisions/0001-phase1-scope.md) |
| 0002 | [Postgres-per-context + Kafka target topology](decisions/0002-postgres-kafka-context-boundaries.md) |
| 0003 | [Container supply chain](decisions/0003-container-supply-chain.md) |
| 0004 | [Modular monolith Phase 1](decisions/0004-modular-monolith-phase1.md) |
| 0005–0013 | Pay/compliance/platform ADRs — see `decisions/` |
| 0014 | [GitHub OSS governance spike](decisions/0014-github-oss-governance-spike.md) |

**Redirect:** [0001-postgres-kafka-context-boundaries.md](decisions/0001-postgres-kafka-context-boundaries.md) → use **0002**.

When Architecture, Security, Integrations, QA, or Legal-process guidance **conflicts**:

1. Do **not** merge contradictory instructions into a single spec.  
2. Open a new markdown file in `decisions/` using `adr-template.md`.  
3. Link that ADR from every affected spec + PR description.  
4. **Revisit when:** ADR must name a concrete trigger (scale, second service, regulatory change), not “later maybe.”

**Orchestrator** keeps `specs/alignment/decisions/` the single source for phase topology and governance ADRs ([0010](decisions/0010-agent-risk-tier-governance.md), [0011](decisions/0011-function-lane-orchestration.md)). **Step 1 — PO gate** via `@hr-product-gate`; then **function-lane DAG** per [`.cursor/rules/orchestrator-hr-erp.mdc`](../../.cursor/rules/orchestrator-hr-erp.mdc) (not a linear Arch→Legal→Impl waterfall).

**Competitive / operate TCO:** [Competitive analysis & roadmap](../competitive-analysis-roadmap.md) (parity matrix, funding tiers); executive brief and TCO worksheet under [`docs/product/`](../docs/product/).

## Conflict log (optional table in PR)

| Topic | Agent A | Agent B | Resolution ADR |
| --- | --- | --- | --- |
