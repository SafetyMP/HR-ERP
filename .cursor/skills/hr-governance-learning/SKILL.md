---
name: hr-governance-learning
description: Adaptation plane — learning ledger, reflect/promote L0-L3, DMAIC/PDCA, CTQ snapshots, router hints. Human-invoked for RGF workflows.
disable-model-invocation: true
paths: specs/governance/**,scripts/governance-learning.mjs,scripts/governance-evidence.mjs,docs/meta/governance-continuous-learning.md
minRiskTier: T2
---

# HR governance learning (Adaptation plane)

Reflective Governance Fabric (RGF) + DMAIC/PDCA ([ADR 0018](../../../specs/alignment/decisions/0018-dmaic-pdca-adaptation-methodology.md), [ADR 0019](../../../specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md)). **Human invokes**; agents do not self-promote policy.

## When

- Running `governance:reflect` (includes `ctqSnapshot`)
- Opening DMAIC project or PDCA loop
- Promoting L1/L2/L3 with gates below

## PDCA checklist (weekly)

- [ ] Plan: reflect report + stub  
- [ ] Do: shadow router hint or L1 trial  
- [ ] Check: `improve measure --ctq …` vs baseline  
- [ ] Act: promote or reject with `principal`

## DMAIC checklist (project)

- [ ] **Define** — `--ctq` or `--brief` required on `improve define`  
- [ ] **Measure** — baseline + optional `--ctq` metric  
- [ ] **Analyze** — RCA stub  
- [ ] **Improve** — promote L1/L2/L3  
- [ ] **Control** — control plan (L2 required)

## Learning tiers

| Tier | Mutates | Gate |
|------|---------|------|
| L0 | Ledger | Automatic |
| L1 | Skill `references/learning/*.md` | PO + CI |
| L2 | `adaptation.skillRouterHints` | Control plan |
| L3 | `additionalPathTriggers` | Counsel + **ADR** + sync-check |

## Evidence (ADR 0019)

- T3+ handoffs: `evidenceBundlePath` + lane sign-offs  
- Collect: `npm run governance:evidence:collect`  
- Verify: `npm run governance:evidence`

## Do not

- L2 without control plan; L3 without `--adr`  
- Define DMAIC without CTQ or brief  
- Weaken non-learnable invariants

## References

- [governance-continuous-learning.md](../../../docs/meta/governance-continuous-learning.md)
- [product-value-ctq-tree.yaml](../../../specs/governance/learning/ctqs/product-value-ctq-tree.yaml)
- [ADR 0019](../../../specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md)
