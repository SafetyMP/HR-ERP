# ADR 0015: DevOps product lifecycle framework (global + HR ERP)

**Date:** 2026-05-30  
**Status:** Accepted  
**Deciders:** Human Lead, Orchestrator  
**Tags:** devops, operations, agents, product-lifecycle, governance

## Context

Agent governance (ADR 0010/0011) covers risk tiers and function lanes but **under-specified release operations**: packaging pointed at data custody, no S&OP/IBP/value loop tied to CI and Vercel deploy truth, and community DevOps skills were not manifest-registered.

HR ERP Phase 1 ops are documented ([competitive-ops-inventory.md](../../../docs/product/competitive-ops-inventory.md), [vercel-managed-phase1-environment.md](../../../docs/operations/vercel-managed-phase1-environment.md)) without a portable agent contract.

## Decision

1. **Global skill** `devops-product-lifecycle` in `~/.cursor/skills/` — software-native **S&OP**, **IBP**, **value delivery**, DORA advisory, co-load map.
2. **Global rules** `core-devops-lifecycle.mdc` (advisory) and `agent-devops-lifecycle.mdc` (`function: release_ops`, T2+).
3. **Manifest v3** — register skill, `release_ops` lane, `devops_lifecycle` path trigger, `release_ops` task bundle; extend `skillIds` / `functionIds`.
4. **HR ERP overlay** — project skill `hr-devops-lifecycle`, templates under `specs/templates/`, framework doc [devops-product-lifecycle-framework.md](../../../docs/meta/devops-product-lifecycle-framework.md).
5. **S&OP / IBP interpretation** — demand/supply/capacity for software delivery; **not** manufacturing BOM or plant planning.

## Consequences

**Positive:**

- Single invoke (`@devops-product-lifecycle`) for lifecycle + ops across repos
- Value delivery links PO gate to deploy evidence without duplicating UAC
- `release_ops` lane invoked by lint when ops paths change

**Negative:**

- PR lifecycle section advisory in v1 (strict lint later)
- Dual manifest sync (global + repo pin) on version bumps

## References

- [global-agent-governance-overlay.md](../../../docs/meta/global-agent-governance-overlay.md) § DevOps lifecycle
- [0010-agent-risk-tier-governance.md](0010-agent-risk-tier-governance.md)
- [0011-function-lane-orchestration.md](0011-function-lane-orchestration.md)
