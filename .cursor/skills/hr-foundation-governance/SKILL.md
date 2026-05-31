---
name: hr-foundation-governance
description: Agent harness foundation — manifest v4, hooks, lint, ALARP, Cursor native unlock. Use for .cursor/**, governance scripts, and meta docs.
disable-model-invocation: true
paths: .cursor/**,scripts/governance-*,docs/meta/cursor-*,specs/alignment/decisions/001*.md
---

# HR foundation governance

Cross-cutting harness work: manifest, hooks, lint, industry alignment. **Human invokes** — do not auto-run merge/deploy.

## When

- Editing `.cursor/governance/**`, `scripts/governance-*`, harness ADRs
- ALARP / Cordum L3 / NIST Agentic Profile evidence gaps
- Plan Mode + `governance:plan` bridge for meta refactors

## Do not

- Replace Cursor `/multitask`, `/worktree`, `/best-of-n`, Automations
- Weaken payroll/Core HR invariants ([repo-boundaries.mdc](../../rules/repo-boundaries.mdc))

## Instructions

1. Classify: `npm run governance:lint`
2. Emit DAG: `npm run governance:plan`
3. Parallel lanes: `/multitask` per `@hr-orchestration-lanes`
4. DDL: `/worktree` + [worktrees.json](../worktrees.json)
5. Cloud verify: [environment.json](../environment.json)
6. Handoff: `specs/**/orchestrator-handoff.json` with `delegatedTaskPlan`
7. CI: `npm run governance:ci` before merge

## References

- [ADR 0016](../../../specs/alignment/decisions/0016-agent-harness-foundation.md)
- [cursor-industry-alignment.md](../../../docs/meta/cursor-industry-alignment.md)
- [cursor-3-native-runtime.md](../../../docs/meta/cursor-3-native-runtime.md)
