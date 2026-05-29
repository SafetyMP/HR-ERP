# ADR 0010: Agent risk-tier governance (Cursor IDE)

**Date:** 2026-05-28  
**Status:** Accepted  
**Deciders:** Human Lead, Orchestrator  
**Tags:** agents, governance, orchestration, security, compliance

## Context

HR ERP uses a Cursor orchestration stack: 15 project skills, 12 agent rules, delegated Task subagents, and PR merge gates. Governance was **process-rich** but **not modular**: “tier” meant mandatory vs conditional skills, FinOps model tiers, or product inference A/B/C — easy to conflate.

The Human Lead adopted **global `~/.cursor/` governance** with a machine-readable manifest and per-project overlays so all repositories share one risk-tier taxonomy while keeping domain skills (e.g. `hr-*`) project-local.

## Decision

Adopt a **five-level risk tier (T0–T4)** for **Cursor IDE agent orchestration**, canonical in `~/.cursor/governance/governance-manifest.yaml`, with:

| Tier | Name | Scope |
|------|------|--------|
| **T0** | Chore | Copy/CSS/docs; zero app/contract/DB/infra |
| **T1** | Standard feature | Parallel DAG: scout+architect → builder → sentinel+verifier (native: `/multitask`) |
| **T2** | Data / identity | + migrations, RLS, auth plane, OCI packaging |
| **T3** | Regulated domain | + pay/time/compliance, payroll kernel, employment AI, product MCP |
| **T4** | Critical / swarm | + multi-Task FinOps, collaboration audit, Human merge gate, premium-model repair (authorized) |

**Separate axes (never merge with T0–T4):**

- **Cursor Task model tier** — `fast` / `medium` / `largest` (delegated Task cost; `hr-erp-finops-swarm`)
- **Product inference tier** — A / B / C (runtime LLM budgets; [ADR 0001](../../architecture/adrs/0001-slm-first-inference-routing.md))
- **Product MCP tool class** — `read_internal` / `read_confidential` / `propose_side_effect` (in-app copilot MCP exposure; project skill `@hr-product-mcp-governance` when present)

**Split orchestration:**

- Global: `~/.cursor/rules/core-orchestrator.mdc` + manifest
- Project: `.cursor/governance-overlay.yaml` + `orchestrator-hr-erp.mdc` (this repo)

**Enforcement:** `governance-lint` CLI suggests tier from diff paths; PRs declare `riskTier` and golden-thread stub when tier ≥ T1. Manifest v3 adds `runtimeProfile: cursor-3-native` and `hookEnforcement: true` — hooks in `.cursor/hooks.json` enforce process; prose rules are advisory.

**Premium repair:** Use `/best-of-n` with Human authorization logged in PR (ADR 0010 exemption).

## Cursor IDE agents vs product MCP agents

| Plane | Boundary | Governance |
|-------|----------|------------|
| **Cursor IDE** | Developer orchestration, Task subagents, skills/rules | T0–T4 manifest, core-orchestrator, PR/handoff schema |
| **Product runtime** | HR copilot, MCP tools, in-app scoring | [`docs/security/agent-mcp-threat-model.md`](../../security/agent-mcp-threat-model.md), [`lib/governance/`](../../../lib/governance/), HITL per [`docs/ai-governance/`](../../ai-governance/) |

Changes that touch **both** (e.g. new MCP tool + Cursor MLOps skill) must satisfy **T3** on the IDE side and product threat-model invariants on the runtime side.

## Premium-model exemption

Premium-tier models (e.g. Opus-class) **do not require** full multi-Task orchestration when the **Human Lead explicitly authorizes emergency repair**. Requirements:

1. Human authorization in thread or incident ticket
2. Post-hoc note or ADR within 24h describing scope and skipped gates
3. No exemption for merge without Security review when application or contract code changed

Default: all tiers follow orchestration. FinOps model tier ≠ risk tier.

## Consequences

**Positive:**

- Single vocabulary across projects; manifest drives handoff schema enums and lint
- Clear escalation T1 → T3 for regulated HR domains
- Global core reusable; HR skills stay authoritative in this repo

**Negative / trade-offs:**

- Dual orchestrator rules (global + project) until Cursor supports rule imports natively
- HR ERP adopts **strict** `governance:ci` per [ADR 0011](0011-function-lane-orchestration.md) (no advisory burn-in on that repo)

**Operational:**

- Run `npm run governance:lint` locally and in CI
- Update manifest version when adding skills or path triggers
- Other repos copy overlay pattern from [`docs/meta/global-agent-governance-overlay.md`](../../meta/global-agent-governance-overlay.md)

## Alternatives considered

1. **Keep monolithic `orchestrator.mdc` only** — rejected; does not scale globally
2. **Numeric L1–L5 unrelated to chore/feature** — rejected; T0 chore escape already entrenched
3. **CI-only enforcement without manifest** — rejected; no cross-project skill enum for handoffs

## Implementation notes

- Manifest: `~/.cursor/governance/governance-manifest.yaml`
- Overlay: [`.cursor/governance-overlay.yaml`](../../../.cursor/governance-overlay.yaml)
- Handoff schema: [`specs/templates/orchestrator-human-issue-handoff.schema.json`](../../templates/orchestrator-human-issue-handoff.schema.json)
- PR template: [`.github/pull_request_template.md`](../../../.github/pull_request_template.md)
- Lint: `~/.cursor/scripts/governance-lint.mjs`; `npm run governance:lint` in HR ERP

## References

- Plan audit: risk-tier agent governance (2026-05-28)
- [`docs/meta/composer-2-orchestration-vs-opus-4.7-repair.md`](../../meta/composer-2-orchestration-vs-opus-4.7-repair.md) — premium exemption rationale
- [`docs/security/agent-mcp-threat-model.md`](../../security/agent-mcp-threat-model.md)
- [`.cursor/skills/README.md`](../../../.cursor/skills/README.md)
