# Cursor harness — native runtime operator guide

Operator guide for **Cursor 3 native runtime** + function-lane governance in HR ERP. Normative: [ADR 0011](../../specs/alignment/decisions/0011-function-lane-orchestration.md). Playbook: [cursor-3-native-runtime.md](cursor-3-native-runtime.md).

## When to parallelize (use `/multitask`)

| Scenario | Lanes |
|----------|-------|
| T1 greenfield feature | `scout` + `architect` (parallel) → `builder` |
| T2+ DDL / migrations | `/worktree` → `custodian` → `builder` |
| Security plane diff | Mandatory `sentinel` before merge |
| T3 pay/compliance/AI | Readonly `counsel` (+ reviewers per paths) |
| T3 product MCP (`lib/copilot/**`) | `ai_governance_reviewer` + `sentinel` |
| T4 ≥2 subagents | Cloud handoff + `/multitask` + `finops_coordinator` |

## Hooks (machine enforcement)

Process lives in [`.cursor/hooks.json`](../../.cursor/hooks.json). Set `GOVERNANCE_HOOK_MODE=enforce` after burn-in (default `shadow`).

## CLI

```bash
npm run governance:lint          # suggested tier + lanes
npm run governance:plan          # JSON DAG for hooks / handoff
npm run governance:pr-body       # PR template stub
npm run governance:ci            # strict CI aggregate
npm run governance:protect-mcp   # Cedar ↔ catalog alignment

node scripts/governance-lint.mjs handoff --strict --file path/to/handoff.json
node scripts/governance-lint.mjs pr-body --strict --body "$(gh pr view --json body -q .body)"
```

## Subagent budget (manifest v3)

1. Tier preamble from `plan --json` (hook `subagentStart`)
2. One `taskBundle` from manifest
3. Max **3** skill paths (`@skill-router`)

## Two MCP planes

**Cursor IDE** — [`.cursor/mcp.json`](../../.cursor/mcp.json). **Product runtime** — `scripts/copilot-mcp-server.ts` + Cedar in `lib/copilot/governance/`. See [antigravity-product-mcp-governance.md](antigravity-product-mcp-governance.md).

## Skills

| Invoke | Role |
|--------|------|
| `@hr-orchestration-lanes` | HR lane recipes |
| `@hr-product-mcp-governance` | In-app copilot MCP |
| `@governance-tier-gate` | Tier + DAG gates |
| `@protect-mcp-governance` | Cedar shadow→enforce |
