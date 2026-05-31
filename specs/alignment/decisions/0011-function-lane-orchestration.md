# ADR 0011: Function-lane orchestration (Cursor harness)

**Date:** 2026-05-28  
**Status:** Accepted  
**Deciders:** Human Lead, Orchestrator  
**Tags:** agents, orchestration, governance, cursor, antigravity  
**Supersedes:** Sequencing semantics in [ADR 0010](0010-agent-risk-tier-governance.md) only (tiers T0–T4 remain canonical)

## Context

ADR 0010 introduced risk tiers and a modular manifest, but orchestration rules still implied a **linear waterfall** (PO → Architecture → Legal → Implementation → Security → QA). Audits ([composer-2-orchestration-vs-opus-4.7-repair.md](../../../docs/meta/composer-2-orchestration-vs-opus-4.7-repair.md)) showed specialist **lanes were not invoked** while token cost rose from repeated skill/plugin dumps per Task.

Google **Antigravity 2.0** (May 2026) centers a **single agent harness** with parallel subagents, dynamic pipelines, and lazy skill loading across IDE/CLI/SDK surfaces. HR ERP stays on **Cursor**; we adopt the harness patterns, not the Gemini runtime.

## Decision

1. **Function lanes** — Map each Cursor delegated Task to a manifest `agentFunction` (scout, architect, builder, custodian, packaging, release_ops, sentinel, verifier, counsel, finops_coordinator, etc.) with `minRiskTier`, `readonly`, and `taskBundle` bindings.
2. **DAG handoffs** — `delegatedTaskPlan[]` supports `function`, `dependsOn`, `parallelGroup`; validated by `governance-lint handoff --strict`.
3. **Scope router** — `pathTriggers` elevate tier and declare `requiredLanes` (e.g. `security_plane` → sentinel mandatory before merge).
4. **Parallel fan-out** — Scout + Architect may run in parallel at T1; Sentinel + Verifier in parallel after Builder; Counsel does not block Builder on non-regulated paths.
5. **Strict CI** — `npm run governance:ci` is **blocking** in reusable-ci (no advisory burn-in for this repo).

**Release ops lane:** `release_ops` covers CI/CD, deploy config, and ops runbooks (T2+). It pairs with the global `@devops-product-lifecycle` skill for S&OP, IBP, and value delivery — see [ADR 0015](0015-devops-product-lifecycle-framework.md).

## Antigravity × Cursor mapping

| Antigravity | HR ERP Cursor |
|-------------|----------------|
| Agent harness | `core-orchestrator` + `governance-manifest.yaml` v4 + overlay |
| Parallel subagents | `Task` + `agentFunctions[].subagentType` |
| Dynamic pipeline | `delegatedTaskPlan` DAG |
| Saved agent profile | `taskBundles` + `agent-*.mdc` |
| CLI | `governance-lint`, `governance:ci` |
| Lazy skills | `@skill-router` + max 3 bodies (v3); lane `allowedPlugins` |

## Enforcement

| Check | Command |
|-------|---------|
| Diff classifier | `governance-lint diff --strict` |
| Golden handoff | `governance-lint handoff --strict --file specs/templates/orchestrator-human-issue-handoff.example.json` |
| PR intake (pull_request) | `governance-lint pr-body --strict` via `GITHUB_EVENT_PATH` |
| Lane plan | `governance-lint plan --strict` when `delegatedTaskPlan` present |

## Premium-model exemption

Unchanged from ADR 0010: Human-authorized emergency repair may skip full lane fan-out; post-hoc note within 24h; Security merge bar not waived for app/contract changes.

## Consequences

**Positive:** Lanes invoked by lint SLA; lower prompt bloat via context budget; aligns with manifest v2.

**Negative:** PRs without `riskTier` / golden thread fail CI until template filled.

## References

- [cursor-antigravity-harness.md](../../../docs/meta/cursor-antigravity-harness.md)
- [global-agent-governance-overlay.md](../../../docs/meta/global-agent-governance-overlay.md)
- [0015-devops-product-lifecycle-framework.md](0015-devops-product-lifecycle-framework.md)
- Manifest: `.cursor/governance/governance-manifest.yaml` (v4) · [0016-agent-harness-foundation.md](0016-agent-harness-foundation.md)
