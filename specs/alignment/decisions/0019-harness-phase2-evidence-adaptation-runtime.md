# ADR 0019: Harness Phase 2 — evidence chain, L3 adaptation, cloud parity, value-efficiency gates

**Date:** 2026-05-31  
**Status:** Accepted  
**Deciders:** Human Lead, Orchestrator  
**Tags:** agents, governance, evidence, adaptation, runtime, value-delivery  
**Extends:** [ADR 0016](0016-agent-harness-foundation.md), [0017](0017-reflective-governance-fabric.md), [0018](0018-dmaic-pdca-adaptation-methodology.md)

## Context

Phase 1 (ADR 0016–0018) established four planes and DMAIC/PDCA inside Adaptation. Gaps remain:

- Lane sign-offs are PR markdown — not tamper-evident
- L3 promotion (manifest path triggers) was deferred
- Cloud agents lack IDE hook parity (`beforeMCPExecution`, `stop`, ledger emit)
- Value delivery records are advisory in PR lint, not merge-blocking

Industry alignment ([cursor-industry-alignment.md](../../../docs/meta/cursor-industry-alignment.md)) tracks DSSE attestations and cloud hooks as future work.

## Decision

Implement **Harness Phase 2** in three tracks with **value creation and efficiency as cross-cutting gates** — not a fifth plane.

### Track 1 — Evidence hardening

| Artifact | Path | Role |
|----------|------|------|
| Evidence bundle schema | `specs/templates/governance-evidence-bundle.schema.json` | Hash chain: handoff, lane state, audit tail, CI run |
| Lane sign-off schema | `specs/templates/governance-lane-signoff.schema.json` | Per-lane verifier, artifact, signedAt |
| CLI | `scripts/governance-evidence.mjs` | `collect`, `verify` |
| Storage | `specs/governance/evidence/` | Bundles + lane-signoffs (git-tracked) |

**v1 attestation:** SHA-256 content hashes + `principal` + timestamp. DSSE Ed25519 deferred until auditor demand; schema reserves `signature` field.

**T3+ strict:** Handoffs require `evidenceBundlePath`; `governance:evidence verify` in `governance:ci`.

### Track 2 — Adaptation depth

| Capability | Behavior |
|------------|----------|
| L3 promote | `governance:promote --tier L3 --adr <path>` merges `additionalPathTriggers` via overlay stub |
| L3 gate | Counsel review marker in stub + ADR path + `NON_LEARNABLE_PATHS` |
| CTQ automation | `improve measure --ctq <id>` resolves harness or product CTQ trees |
| Reflect | Weekly report includes `ctqSnapshot` |
| Router hints | CI warns if hints remain `shadow` after `routerHintsEnforceFrom` |
| Product CTQs | `product-value-ctq-tree.yaml` links win scorecard W1–W7 |

### Track 3 — Runtime parity

| Capability | Behavior |
|------------|----------|
| Cloud verify | `.cursor/environment.json` `verify`: `npm run governance:ci` |
| Automations | PR body strict lint on T2+; weekly drift workflow |
| Cloud ledger shim | `governance-cloud-session.mjs` appends ledger rows from CI when IDE hooks absent |

### Value and efficiency gates (cross-cutting)

| Gate | Enforcement |
|------|-------------|
| Value delivery record | **Strict** T1+ product PRs (`pr-body --strict`); harness-only exempt |
| S&OP linkage | T2+ handoffs with `valueDeliveryRecordPath` require `sopCycleId` |
| DMAIC Define | Charter must cite harness CTQ, product CTQ, or feature brief (`--ctq` or `--brief`) |
| FinOps | T4 swarms + CTQ `finops_cost_spike_rate` unchanged |
| IBP | Quarterly checkpoint reconciles [stakeholder-value-plan.md](../../../docs/product/stakeholder-value-plan.md) |

## Non-goals

- Fifth Quality or Value plane
- Full DSSE / SPC charts in CI v1
- Cloud `beforeMCPExecution` until Cursor ships (CI backstop only)
- Autonomous L3 promote without Human `principal`

## Success metrics

| Metric | Target |
|--------|--------|
| T3+ handoffs with verified evidence bundle | 100% |
| T1+ product PRs with value-delivery-record | 100% strict |
| CTQ snapshot in weekly reflect | Harness + product CTQs |
| L2 promote with control plan | Maintained 100% |

## References

- [governance-continuous-learning.md](../../../docs/meta/governance-continuous-learning.md)
- [cursor-industry-alignment.md](../../../docs/meta/cursor-industry-alignment.md)
- [devops-product-lifecycle-framework.md](../../../docs/meta/devops-product-lifecycle-framework.md)
- [0018-dmaic-pdca-adaptation-methodology.md](0018-dmaic-pdca-adaptation-methodology.md)
