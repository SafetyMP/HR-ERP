# Cursor Cloud Agents — HR ERP

Operator guide for **T4 swarms** and long-running harness work when the IDE laptop is unavailable.

Normative: [ADR 0019](../../specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md) · Runtime: [cursor-3-native-runtime.md](../meta/cursor-3-native-runtime.md)

## When to use Cloud

| Scenario | Use Cloud Agent |
|----------|-----------------|
| T4 ≥2 delegated Tasks / finops swarm | Yes — `/multitask` queue + Cloud handoff |
| Harness/meta PR spanning many files | Yes — verify runs in cloud |
| Short T1 bugfix | Local IDE sufficient |
| DDL `/worktree` custodian lane | Prefer local (worktree is IDE-native) |

## Setup

1. Open **Agents Window** (`Cmd+Shift+P → Agents Window`)
2. Add multi-root folders per [cursor-3-native-runtime.md](../meta/cursor-3-native-runtime.md): repo root, `packages/payroll-calc`, `contracts/`, `services/`
3. Cloud uses [`.cursor/environment.json`](../../.cursor/environment.json):
   - `install`: `npm ci`
   - `verify`: `npm run governance:ci`

## Cloud vs IDE hook parity

| IDE hook | Cloud backstop |
|----------|----------------|
| `beforeMCPExecution` | Team [mcp.json](../../.cursor/mcp.json) allowlist only |
| `preToolUse` (counsel-before-builder) | Handoff JSON + human review |
| `stop` (PR stub) | `governance-pr-autofill.yml` on GitHub |
| Learning ledger | [governance-cloud-session.mjs](../../scripts/governance-cloud-session.mjs) emits from CI |

Do not assume Cloud Agents inherit IDE hook enforcement — always run `npm run governance:ci` in cloud verify.

## T4 swarm checklist

1. Human PO authorizes T4 + FinOps note (`@hr-swarm-governance`)
2. Emit handoff with `delegatedTaskPlan` and `evidenceBundlePath`
3. Hand off to Cloud Agent with plan JSON from `npm run governance:plan`
4. Drain `/multitask` queue; one consolidation pass if ping-pong trips
5. Cloud verify must pass before Human merge

## Automations (GitHub equivalent)

Cursor Automations at [cursor.com/automations](https://cursor.com/automations) mirror repo workflows:

| Automation | Repo workflow |
|------------|---------------|
| `governance-pr-body-lint` | [.github/workflows/governance-pr-autofill.yml](../../.github/workflows/governance-pr-autofill.yml) — strict `pr-body` on T2+ |
| `governance-drift-weekly` | [.github/workflows/governance-drift-weekly.yml](../../.github/workflows/governance-drift-weekly.yml) |
| `t4-swarm-handoff` | Manual Cloud handoff + `/multitask` |

No `auto_apply` on T2+ product paths.

## Related

- [agent-team-map.md](../meta/agent-team-map.md) — lane roster
- [environment.json](../../.cursor/environment.json) — cloud verify command
