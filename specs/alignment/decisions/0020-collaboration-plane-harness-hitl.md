# ADR 0020: Collaboration plane (Harness HITL)

**Date:** 2026-05-31  
**Status:** Accepted  
**Deciders:** Human Lead, Orchestrator  
**Tags:** agents, governance, collaboration, hitl, manifest-v4  
**Extends:** [ADR 0016](0016-agent-harness-foundation.md), [0017](0017-reflective-governance-fabric.md), [0019](0019-harness-phase2-evidence-adaptation-runtime.md)

## Context

ADR 0016–0019 established four harness planes (Policy, Runtime, Evidence, Adaptation). PO checkpoints and Plan Mode bridged human intent, but orchestration still allowed specialized skills and Task delegation before humans recorded tradeoff decisions. Industry guidance (Cordum L3, proposed NIST Agentic Profile, ISO 42001 A.4, EU AI Act Art. 14 evidence) expects **architectural** human oversight — gates outside the model, structured decision packets, post-execution review, and timeout policies that never auto-approve.

This is **Harness HITL** (design-time IDE orchestration), distinct from **Product HITL** ([docs/ai-governance/HITL_POLICY.md](../../../docs/ai-governance/HITL_POLICY.md) / [`lib/governance/hitl.ts`](../../../lib/governance/hitl.ts)) and from EU AI Act deploy-time measures.

## Decision

Add a **fifth Collaboration plane** with a **seven-phase loop**, skill-phase and action-class gating, durable handoff binding at T3+, and shadow→enforce rollout.

### Five planes

| Plane | Artifacts | Role |
|-------|-----------|------|
| **Policy** | manifest v4, ADRs, rules, skills | Tiers, lanes, triggers, `collaboration` block |
| **Runtime** | hooks, lane state | Phase inject, collaboration gates |
| **Evidence** | handoffs, bundles, PR body | `humanDecisionRecord`, `revalidationConfirmed`, phase-7 sign-off |
| **Adaptation** | ledger, CTQs, router hints | Gate bypass, rubber-stamp, graduated autonomy |
| **Collaboration** | plan template, `@hr-human-collaboration`, `collaborationPlan` JSON | Human deliberation before specialized tools |

### Scope: Harness vs Product vs EU AI Act

| Layer | When | Artifact | Override |
|-------|------|----------|----------|
| Collaboration plane | IDE / design-time | `.cursor/plans/*.md`, handoff `collaborationPlan` | Challenge plan; reject → phase 2 |
| Product HITL | Runtime employment-AI | `lib/governance/hitl.ts` | APPROVED → EXECUTED |
| EU AI Act Art. 14 | Deployed high-risk AI | Product docs + deployer UI | Disregard / override / stop |

### Seven-phase loop

| Phase | Oversight | Purpose |
|-------|-----------|---------|
| 1 Initial proposal | HOTL | Intent, tier, bounded contexts |
| 2 Strategy options | HOTL | ≥2 strategies with risk/reward/rollback |
| 3 Human input | **HITL** | Record decisions; routing skills only |
| 4 Execute human plan | HOTL | Implement approved plan |
| 5 Revalidation | HOTL | Drift check before specialized tools |
| 6 Specialized tools | **HITL** | Tasks, MCP, specialized skills |
| 7 Output review | HOTL | Deliverables vs `chosenStrategy` (Cordum Pattern 5) |

**T0:** skip phases 3–7 (`step 1 chore N/A`).

**Rejection:** phase 3 or 5 reject → return to phase 2; log `rejectionHistory[]`.

**Timeout:** `timeoutPolicy: deny` — pending revalidation **never** auto-unlocks specialized skills. On expiry: deny or escalate to Human PO.

### Cordum pattern mapping

| Pattern | Phase |
|---------|-------|
| Pre-execution approval gate | 3, 6 |
| Exception escalation | 2; tier drift → 5 |
| Graduated autonomy | Adaptation L1 router hint after N clean sessions |
| Sampled audit | CTQ `collaboration_rubber_stamp_rate` |
| Post-execution output review | 7 |

### Manifest `collaboration` block

- `skillPhases`: `routing` | `execution` | `specialized`
- `actionClasses`: `read_only`, `reversible_write`, `irreversible_or_regulated`
- `interruptConditions`: tier_drift, specialized_early_load, counsel_missing, revalidation_timeout
- `requireHandoffRevalidationAtTier: T3` — git-tracked handoff required (session lane state alone insufficient)
- `graduatedAutonomy` — per-pathClass shadow inject reduction via Adaptation promote

### LangGraph limitation

Cursor IDE hooks use session-scoped `session-lane-state.json`; there is no graph-native durable interrupt mid-turn. **T3+** merge gates require handoff `revalidationConfirmed: true` and evidence bundle hash of `humanDecisionRecord`.

### Rollout

| Stage | Behavior |
|-------|----------|
| Shadow (initial) | Advisory inject; ledger signals |
| Enforce T3+ | `collaborationGateEnforceFrom` in hook-mode |
| Enforce T1+ | After bypass rate acceptable |

### Success metrics

| Metric | Target |
|--------|--------|
| T1+ sessions with `decisionOverview` | Track via plan/handoff |
| Specialized loads post-revalidation | 100% when enforced |
| `collaboration_gate_bypass_rate` | Decrease via Adaptation |
| `collaboration_rubber_stamp_rate` | Below threshold |
| Phase-7 divergence rate | Track + return to phase 3 |

### Industry alignment (informative)

Aligned with Cordum L3, ISO 42001 A.4, EU AI Act Art. 14 evidence chain, CSA Autonomy L1–L2, and the **proposed** (not official NIST) Agentic Profile extensions.

## Non-goals

- Replacing Product HITL or employment-action APIs
- Timeout-as-approval
- Prompt-only “ask user first” without hook enforcement
- LangGraph-grade mid-turn interrupt in IDE v1
- Fifth Quality/Value plane (ADR 0019 cross-cut unchanged)

## Consequences

**Positive:** Challengeable decision rationale; deferred specialized skills; post-execution review; audit-ready handoffs.

**Negative:** Extra plan/handoff overhead on T1+; T3+ requires complete collaboration artifacts before merge.

## References

- [collaboration-plan.md](../../templates/collaboration-plan.md)
- [@hr-human-collaboration](../../../.cursor/skills/hr-human-collaboration/SKILL.md)
- [governance-continuous-learning.md](../../../docs/meta/governance-continuous-learning.md)
- [cursor-industry-alignment.md](../../../docs/meta/cursor-industry-alignment.md)
- [0019-harness-phase2-evidence-adaptation-runtime.md](0019-harness-phase2-evidence-adaptation-runtime.md)

## Smoke test (shadow)

1. T1: options → human decision → revalidation → specialized unlock → phase-7 pass  
2. Rejection at phase 3 → phase 2 (no phase 6)  
3. Revalidation timeout → specialized denied  
4. T3 handoff without `revalidationConfirmed` → lint strict fail  
5. Phase-7 divergence → `collaboration_divergence` signal
