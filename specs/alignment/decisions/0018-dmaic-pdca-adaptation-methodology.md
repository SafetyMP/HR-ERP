# ADR 0018: DMAIC/PDCA methodology inside Adaptation plane

**Date:** 2026-05-31  
**Status:** Accepted  
**Deciders:** Human Lead, Orchestrator  
**Tags:** agents, governance, dmaic, pdca, six-sigma, adaptation  
**Extends:** [ADR 0017](0017-reflective-governance-fabric.md) (RGF Adaptation plane)

## Context

ADR 0017 added the Adaptation plane with signals, reflect, and promote (L0–L2). Industry continuous-improvement practice (Lean Six Sigma DMAIC, Deming PDCA) expects explicit **Define** (CTQs, charter), **Measure** (baselines), **Analyze** (RCA), **Improve** (pilot), and **Control** (sustainment plans)—not only ad-hoc promotion.

Evaluation concluded a **fifth plane is premature**; methodology layers inside RGF are sufficient until CTQ/control-plan volume warrants organizational separation.

## Decision

Embed **DMAIC** and **PDCA** as methodology layers **inside** the Adaptation plane—not a new harness plane.

### Methodology mapping

| Method | Use | Harness artifacts |
|--------|-----|-------------------|
| **PDCA** | 1–2 week tactical loops | shadow router hints → reflect → promote/reject |
| **DMAIC** | 4–8 week improvement projects | charter, baseline, RCA, promote, control plan |
| **DMADV** | Greenfield harness design | New ADR + architect lane (not DMAIC) |

### DMAIC → RGF

| Phase | RGF artifact / command |
|-------|------------------------|
| Define | [harness-ctq-tree.yaml](../../governance/learning/ctqs/harness-ctq-tree.yaml), [improvement-project-charter.md](../../governance/learning/templates/improvement-project-charter.md) |
| Measure | `governance:improve measure`, baselines under `learning/baselines/` |
| Analyze | `governance:improve analyze`, RCA under `learning/rca/` |
| Improve | `governance:promote` L1/L2 |
| Control | [control-plan template](../../governance/learning/templates/control-plan.yaml), required for L2 close-out |

### PDCA → shadow promote

1. **Plan** — reflect hypothesis + stub  
2. **Do** — router hint `status: shadow` or L1 reference trial  
3. **Check** — ledger metric vs baseline  
4. **Act** — promote to `active` / L2 or `rejected`

### CTQs (Critical to Quality)

Canonical tree: `specs/governance/learning/ctqs/harness-ctq-tree.yaml`. Big Y: merge-ready regulated delivery. Little y: lane compliance, handoff discover, composition_miss rate, etc.

### Control plans (L2 gate)

L2 `governance:promote` requires `--control-plan` pointing to a validated control plan YAML unless `--dry-run`. Plan defines metric, owner, review cadence, reaction plan.

### Six Sigma concepts adopted (lightweight)

- CTQ drilldown, operational definitions, baselines, DPMO-style defect rates on signals  
- Poka-yoke = Runtime hook fail-closed (not DMAIC-owned)  
- **Not required:** belt ceremony, full SIPOC per chore, 6σ proof on small samples

### When to split a fifth Quality plane (future)

All true: ~20+ active control plans; separate Harness CI team; crowded CLI; ISO 42001 audit asks for distinct management system.

## Non-goals

- Fifth plane in this ADR  
- Full SPC/control charts in CI v1  
- DMADV automation  
- Online RL disguised as PDCA

## Consequences

**Positive:** ISO 42001-aligned improvement loop; structured RCA; L2 sustainment; PDCA formalizes existing shadow→enforce path.

**Negative:** L2 promotions require control plan authoring; DMAIC projects add doc overhead for chronic issues only.

## References

- [governance-continuous-learning.md](../../../docs/meta/governance-continuous-learning.md)
- [0017-reflective-governance-fabric.md](0017-reflective-governance-fabric.md)
- [0016-agent-harness-foundation.md](0016-agent-harness-foundation.md)
