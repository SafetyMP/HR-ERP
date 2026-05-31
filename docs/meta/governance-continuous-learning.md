# Governance continuous learning (Adaptation plane)

Operator guide for **Reflective Governance Fabric (RGF)** — the fourth harness plane. Normative: [ADR 0017](../../specs/alignment/decisions/0017-reflective-governance-fabric.md) · [ADR 0018](../../specs/alignment/decisions/0018-dmaic-pdca-adaptation-methodology.md) · [ADR 0019](../../specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md).

## Five planes

| Plane | Artifacts |
|-------|-----------|
| Policy | manifest v4, rules, skills |
| **Collaboration** | `@hr-human-collaboration`, collaboration-plan, `collaborationPlan` JSON |
| Runtime | hooks, lane state, audit.log, cloud session shim |
| Evidence | governance:ci, handoffs, evidence bundles, PR body |
| **Adaptation** | learning ledger, reflect, promote L0–L3, DMAIC/PDCA |

## Dual ledger

| Store | Path | Git |
|-------|------|-----|
| Raw signals | `.cursor/hooks-output/learning-ledger.jsonl` | Ignored |
| Promoted / reports / CTQs / control plans / evidence | `specs/governance/` | Tracked |

## Commands

```bash
npm run governance:learning:validate
npm run governance:reflect
npm run governance:evidence              # verify bundles (discover handoffs)
npm run governance:evidence:collect -- --handoff specs/.../orchestrator-handoff.json --principal "Name"
npm run governance:cloud-session         # CI ledger shim when IDE hooks absent
node scripts/governance-learning.mjs promote --tier L3 --stub … --adr specs/alignment/decisions/0019-….md --principal "Name"
```

### DMAIC (`governance:improve`)

| Phase | Command |
|-------|---------|
| Define | `improve define --project … --principal … --ctq …` **or** `--brief …` |
| Measure | `improve measure --project … [--ctq composition_miss_rate] [--days 14]` |
| Analyze | `improve analyze --signal <uuid> --principal "Name"` |
| Improve | `governance:promote` (L1/L2/L3) |
| Control | `improve control --signal <uuid> …` |

CTQ trees:

- Harness: [ctqs/harness-ctq-tree.yaml](../../specs/governance/learning/ctqs/harness-ctq-tree.yaml)
- Product W1–W7: [ctqs/product-value-ctq-tree.yaml](../../specs/governance/learning/ctqs/product-value-ctq-tree.yaml)

Reflect reports include **`ctqSnapshot`** (harness rates + product scorecard status).

## Learning tiers

| Tier | Mutates | Gate |
|------|---------|------|
| L0 | Ledger only | Automatic |
| L1 | Skill `references/learning/*.md` | PO + CI |
| L2 | Overlay `adaptation.skillRouterHints` | Architect + control plan |
| L3 | Overlay `additionalPathTriggers` | Counsel + ADR + sync-check |

## PDCA weekly loop (tactical)

1. **Plan** — `governance:reflect` hypothesis + stub  
2. **Do** — router hint `status: shadow` or L1 reference trial  
3. **Check** — `improve measure --ctq …` vs baseline (SPC-lite warn on reflect dry-run)  
4. **Act** — `promote` or reject with `principal`

## Value and efficiency

- T1+ product PRs: **strict** value-delivery-record in PR body  
- T3+ handoffs: **evidence bundle** + lane sign-offs  
- DMAIC Define: requires `--ctq` or `--brief`  
- FinOps: T4 + CTQ `finops_cost_spike_rate`

## Rollout

Dates in [hook-mode.json](../../.cursor/governance/hook-mode.json) `v4Rollout`. After `routerHintsEnforceFrom`, CI fails if hints remain `shadow`.

## Non-goals

- Fifth Quality/Value plane  
- Full DSSE / SPC charts in CI v1  
- Autonomous promotion
