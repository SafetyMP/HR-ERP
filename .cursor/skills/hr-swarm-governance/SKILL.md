---
name: hr-swarm-governance
description: >-
  HR ERP multi-agent FinOps, collaboration post-mortems, contributor triage, and
  golden-thread audits. Use when ≥2 delegated Tasks on one feature, swarm
  retrospectives, or human-authored PR/issue handoffs.
risk: high
minRiskTier: T4
source: project
disable-model-invocation: true
---

# HR swarm governance

## Use this skill when

- Two or more Cursor Tasks on one feature thread (FinOps note required)
- Human Lead requests collaboration audit or golden-thread scoring
- Community PR triage with orchestrator JSON handoff

## Do not use this skill when

- Single-thread implementation
- T0–T3 without swarm or post-mortem trigger

## Instructions

1. Emit **FinOps checkpoint**: model tier per **function lane**; context budget per Task (no plugin dump).
2. Post-mortem: `golden-thread-trace-table.md`; score DAG integrity (lanes invoked vs plan).
3. Handoff JSON: `function` ids only — **ban** archived `hr-erp-*` skill names in prompts.
4. `governance:ci` strict — do not waive on external PRs.
5. Ping-pong breaker: 3 same-domain `fix:` commits → escalate Human.

## Resources

- [references/finops-swarm.md](references/finops-swarm.md)
- [references/collaboration-audit.md](references/collaboration-audit.md)
- [docs/meta/global-agent-governance-overlay.md](../../../docs/meta/global-agent-governance-overlay.md)

## Limitations

- Cursor Task cost governance only — not in-app inference budgets (ADR 0001)
