---
name: hr-foundation-governance
description: Agent harness foundation — manifest v4, hooks, lint, ALARP, Cursor native unlock, Phase 2 evidence. Use for .cursor/**, governance scripts, and meta docs.
disable-model-invocation: true
paths: .cursor/**,scripts/governance-*,docs/meta/cursor-*,specs/alignment/decisions/001*.md
---

# HR foundation governance

Cross-cutting harness work: manifest, hooks, lint, industry alignment. **Human invokes** — do not auto-run merge/deploy.

## When

- Editing `.cursor/governance/**`, `scripts/governance-*`, harness ADRs (0016–0019)
- ALARP / Cordum L3 / NIST Agentic Profile evidence gaps
- Plan Mode + `governance:plan` bridge for meta refactors
- Evidence bundles, cloud session verify, team-map / agent-rules sync

## Do not

- Replace Cursor `/multitask`, `/worktree`, `/best-of-n`, Automations
- Weaken payroll/Core HR invariants ([repo-boundaries.mdc](../../rules/repo-boundaries.mdc))
- Duplicate DMAIC/PDCA checklists — use `@hr-governance-learning` for promote/reflect

## Instructions

1. Classify: `npm run governance:lint`
2. Emit DAG: `npm run governance:plan`
3. Parallel lanes: `/multitask` per `@hr-orchestration-lanes`
4. DDL: `/worktree` + [worktrees.json](../worktrees.json)
5. Cloud verify: [environment.json](../environment.json) → `npm run governance:ci`
6. Evidence (ADR 0019): `npm run governance:evidence collect|verify`
7. Cloud session ledger: `npm run governance:cloud-session emit`
8. Handoff: `specs/**/orchestrator-handoff.json` with `delegatedTaskPlan`
9. Team roster: [agent-team-map.md](../../../docs/meta/agent-team-map.md)
10. CI: `npm run governance:ci` before merge

## Phase 2 gates (ADR 0017–0019)

| ADR | Focus |
|-----|-------|
| 0017 | Evidence bundle schema + lane signoffs |
| 0018 | Adaptation plane — DMAIC/PDCA via `@hr-governance-learning` |
| 0019 | Runtime parity, strict VDR (T1+), value/efficiency cross-cut |
| 0020 | Collaboration plane — Harness HITL seven-phase loop |

## References

- [ADR 0016](../../../specs/alignment/decisions/0016-agent-harness-foundation.md)
- [ADR 0017](../../../specs/alignment/decisions/0017-reflective-governance-fabric.md)
- [ADR 0018](../../../specs/alignment/decisions/0018-dmaic-pdca-adaptation-methodology.md)
- [ADR 0019](../../../specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md)
- [cursor-industry-alignment.md](../../../docs/meta/cursor-industry-alignment.md)
- [cursor-3-native-runtime.md](../../../docs/meta/cursor-3-native-runtime.md)
- [agent-team-map.md](../../../docs/meta/agent-team-map.md)
