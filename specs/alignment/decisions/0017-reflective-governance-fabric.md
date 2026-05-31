# ADR 0017: Reflective Governance Fabric (Adaptation plane)

**Date:** 2026-05-31  
**Status:** Accepted  
**Deciders:** Human Lead, Orchestrator  
**Tags:** agents, governance, adaptation, continuous-learning, manifest-v4  
**Extends:** [ADR 0016](0016-agent-harness-foundation.md) (three-plane harness)

## Context

ADR 0016 established Policy, Runtime, and Evidence planes with Cordum L3-aligned merge gates. Industry frameworks (NIST AI RMF Measure/Manage, ISO 42001 improvement loops) expect **controlled policy evolution** from operational signals—not ad-hoc prompt edits or agent self-modification.

Rules (`.mdc`) and skills (`SKILL.md` + references) can drift from runtime behavior: wrong skill routing, repeated lane gaps, tier mismatches, and composition misses between path triggers and delegated plans.

## Decision

Add a **fourth Adaptation plane** — **Reflective Governance Fabric (RGF)** — with dual ledger storage and L0–L4 promotion tiers.

| Plane | Artifacts | Role |
|-------|-----------|------|
| **Policy** | manifest v4, rules, skills, lock | Machine-readable tiers, lanes, triggers |
| **Runtime** | hooks, lane state, audit.log | Stateful enforcement |
| **Evidence** | governance-lint, handoffs, PR body | Merge-blocking proof |
| **Adaptation** | learning ledger, reflect/promote CLI, promoted records | Controlled co-evolution of rules/skills |

### Dual ledger

| Store | Path | Git | Purpose |
|-------|------|-----|---------|
| Raw signals | `.cursor/hooks-output/learning-ledger.jsonl` | Ignored | Session-local L0 append |
| Promoted / reports | `specs/governance/learning/` | Tracked | Stubs, reports, promotion records |

### Learning tiers (L0–L4)

| Tier | Mutates | Gate |
|------|---------|------|
| **L0** | Append ledger row | Automatic (hooks / lint) |
| **L1** | Skill `references/learning/*.md` | PO + `governance:ci` + `--principal` |
| **L2** | Overlay `adaptation.skillRouterHints`, chore metadata | Architect lane + `governance:sync-check:strict` |
| **L3+** | Manifest triggers, hook matchers | Counsel + ADR (future) |

### Non-learnable invariants

These MUST NOT be weakened by any promotion:

- Payroll never mutates Core HR DB ([repo-boundaries.mdc](../../../.cursor/rules/repo-boundaries.mdc))
- Hook `failClosed` on destructive shell / non-allowlisted MCP
- T4 human merge gate
- `disable-model-invocation: true` on `hr-foundation-governance`, `hr-swarm-governance`
- Forward-only migrations on shared branches

### Signal kinds

`hook_deny`, `lane_gap`, `ci_fail`, `friction`, `composition_miss`, `tier_mismatch`, `cost_spike`

Schema: [governance-learning-signal.schema.json](../../templates/governance-learning-signal.schema.json)

### Risk axes (v1 — rule-based, no ML)

| Axis | Detector |
|------|----------|
| Execution | Missing critical lanes |
| Composition | Path trigger skills vs plan mismatch |
| Drift | Handoff plan vs session completed lanes |
| Tier | PR declared vs lint suggested |
| Economics | Manual T4 FinOps `cost_spike` |

### Rollout

Dates in [hook-mode.json](../../../.cursor/governance/hook-mode.json) `v4Rollout`: ledger emit → reflect → router hints shadow → enforce.

## Success metrics

| Metric | Target |
|--------|--------|
| T3+ sessions with gap/deny | Emit ≥1 ledger row |
| Weekly reflect | Report under `specs/governance/learning/reports/` |
| Promotions | ≥1 L1/L2/month on active repos; zero non-learnable touches |
| Router hints | Measure `composition_miss` rate pre/post enforce date |

## Non-goals

- Autonomous agent self-promotion without Human `principal`
- Online RL on prompts
- L3+ promotion in this ADR tranche
- DSSE attestations (future; see ADR 0016)
- Cloud hook parity for ledger emit (CI + IDE in v1)

## Consequences

**Positive:** Auditable improvement loop; composition risk visibility; Cordum L3+ continuous assurance narrative.

**Negative:** Contributors must run `governance:reflect` periodically; open L2 stubs may warn in CI after 30d on T3+ paths.

## References

- [governance-continuous-learning.md](../../../docs/meta/governance-continuous-learning.md)
- [0019-harness-phase2-evidence-adaptation-runtime.md](0019-harness-phase2-evidence-adaptation-runtime.md)
- [0018-dmaic-pdca-adaptation-methodology.md](0018-dmaic-pdca-adaptation-methodology.md)
- [cursor-industry-alignment.md](../../../docs/meta/cursor-industry-alignment.md)
- [0016-agent-harness-foundation.md](0016-agent-harness-foundation.md)
