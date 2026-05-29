# MLOps and AI infrastructure docs

Operational reference for **inference economics**, **predictive model monitoring**, and **agent / MCP isolation** in the HR ERP.

| Document | Summary |
|----------|---------|
| [ADR 0001: SLM-first inference routing](../architecture/adrs/0001-slm-first-inference-routing.md) | Tiered models, router thresholds, budget guardrails, inference SLOs |
| [Prediction logging and drift](./prediction-logging-and-drift.md) | Warehouse schema for scores, drift metrics, alert severities |
| [Implementation sequence](./implementation-sequence.md) | **Archived** — production ML deferred; see [stakeholder-value-plan](../product/stakeholder-value-plan.md) |
| [Agent and MCP threat model](../security/agent-mcp-threat-model.md) | Trust boundaries, sandboxing, tool allowlists, audit |

Before implementing AI capabilities, also follow [AGENTS.md](../../AGENTS.md) (feature briefs, PO gate).
