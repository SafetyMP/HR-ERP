# Multi-agent rerun checklist — function-lane swarm grade

Use when the Human Lead wants **high rubric-A** collaboration scores (explicit specialist **lanes**, not a single-thread hero). See [ADR 0011](../alignment/decisions/0011-function-lane-orchestration.md).

Before opening Implementation Tasks:

## 1. PO gate captured in-band

Paste the **verbatim** Task preamble from [orchestrator-hr-erp.mdc](../../.cursor/rules/orchestrator-hr-erp.mdc) into **every** coordinating transcript or delegated Task.

## 2. Task decomposition (manifest `agentFunctions`)

| function | Skills / rules (minimal) |
| --- | --- |
| scout (readonly) | `@hr-product-gate` + brief path |
| architect (readonly) | `@hr-domain-boundaries`, `agent-architecture` |
| custodian (T2+ DDL) | `@hr-data-custody`, `agent-db-migration-state` |
| builder | `@lint-and-validate`, `agent-code-health`, `agent-security` |
| counsel (T3 readonly) | `@hr-regulated-domain`, `agent-legal-hr-compliance` |
| sentinel (**required** on security plane) | `@cc-skill-security-review`, `agent-security` |
| verifier | `@hr-quality-lab`, `agent-qa` |
| finops_coordinator (T4, ≥2 Tasks) | `@hr-swarm-governance`, `agent-finops` |

Generate baseline DAG: `node scripts/governance-lint.mjs plan`

## 3. Artifact chain for audit replay

1. Brief path + ≤6-line PO checkpoint.
2. `delegatedTaskPlan` in handoff JSON or PR (function + dependsOn).
3. Golden thread stub ([golden-thread-trace-table.md](./golden-thread-trace-table.md)).
4. CI: `npm run governance:ci` PASS.

Without (1)–(3), score as single-thread honesty in post-mortems.
