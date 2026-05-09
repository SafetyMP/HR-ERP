# Implementation sequence: AI platform rollout

Ordered phases for the AI platform in this repository (inference, predictive scoring, agents). Dependencies flow **down**; do not start a phase until the previous **exit criteria** are met.

## Phase 1 — Inference foundation

**Objective:** One **Inference API** with routing, logging, and tenant isolation for **generative** workloads (per [ADR 0001](../architecture/adrs/0001-slm-first-inference-routing.md)).

**Build**

- Internal service or module: authenticate caller, attach `tenant_id` / `subject_id`.
- Router: rules + classifier; Tier A/B/C backends as config.
- Tenant-scoped semantic + exact cache with content-version in keys.
- Structured logs: tier chosen, latency, token usage (aggregated), provider error class — **no** raw PII in shared logs.

**Exit criteria**

- p95 Tier A latency within ADR targets in staging.
- Budget guardrails integration tested (soft cap → degradation path).

## Phase 2 — Predictive scoring and drift

**Objective:** Production scoring with **prediction log** and **automated drift jobs** (per [Prediction logging and drift](./prediction-logging-and-drift.md)).

**Build**

- Feature store contract (versioned) or approved interim feature builder.
- Batch and/or real-time scoring writing to `ml_prediction_log` (or equivalent).
- Scheduled jobs: PSI, null rate, output mass shift, segment hot-spots.
- Alert routing: warn → ticket; page → on-call; kill-switch playbook documented.

**Exit criteria**

- Shadow scoring path validated for one model (e.g. flight risk).
- Kill-switch dry-run toggles fallback without data loss.

## Phase 3 — Agent orchestration and MCP sandboxes

**Objective:** Secure **multi-agent** orchestration with [Agent and MCP threat model](../security/agent-mcp-threat-model.md) controls.

**Build**

- Orchestrator with JWT/mTLS context propagation from [`AuthContext`](../../lib/security/auth-context.ts).
- Tool allowlists per agent persona; integrate with existing policy engine where side effects touch Postgres.
- MCP deployment: stateless workers + per-request scoped tokens; audit stream.
- Sandboxed agent workers per isolation guidelines.

**Exit criteria**

- Pen-test or internal red-team scenario: cross-tenant tool call **fails closed**.
- Audit events queryable by `correlation_id` end-to-end.

## Cross-cutting work (ongoing)

- ADR and threshold review **30 days** after GA (router confidence, PSI cutoffs).
- Quarterly Architecture review of **Tier mix** and **cost per tenant**.
- Data governance sign-off for prediction log retention and **features_digest** handling.

## Document index

| Document | Purpose |
|----------|---------|
| [ADR 0001](../architecture/adrs/0001-slm-first-inference-routing.md) | SLM-first routing, SLOs, budgets |
| [Prediction logging and drift](./prediction-logging-and-drift.md) | Schema, metrics, alerts |
| [Agent MCP threat model](../security/agent-mcp-threat-model.md) | Trust boundaries, sandbox |
| [README](./README.md) | MLOps docs entry point |
