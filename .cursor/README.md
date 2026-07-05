# HR ERP — Cursor workspace harness

This repo **intentionally ships** an in-repo agent governance harness for OSS contributors. See [evergreen-open-source-positioning.md](../docs/meta/evergreen-open-source-positioning.md) and [cursor-3-native-runtime.md](../docs/meta/cursor-3-native-runtime.md).

## What is committed (contributor-facing)

| Path                                    | Purpose                                           |
| --------------------------------------- | ------------------------------------------------- |
| `.cursor/rules/`                        | Lane agents, repo boundaries, orchestrator        |
| `.cursor/skills/`                       | Project skills (tier-gated HR domain depth)       |
| `.cursor/hooks.json` + `.cursor/hooks/` | Governance hook plane (manifest v4)               |
| `.cursor/mcp.json`                      | Team MCP allowlist (IDE plane — context7, prisma) |
| `.cursor/governance/`                   | Manifest, hook mode, global-skills lock           |
| `.cursor/governance-overlay.yaml`       | Optional external gateway overlay                 |
| `.cursor/environment.json`              | Cursor environment metadata                       |
| `.cursor/worktrees.json`                | Worktree defaults for parallel agents             |

## Keep local (gitignored)

| Path                     | Why                               |
| ------------------------ | --------------------------------- |
| `.cursor/hooks-output/`  | Hook audit receipts (shadow mode) |
| `.cursor/agents/`        | Personal custom agent definitions |
| `.cursor/mcp.local.json` | Machine-specific MCP overrides    |

## OSS publish gate

```bash
npm run publish:check
```

CI runs the same script. Generic `harness publish-doctor` may still **warn** on `hooks.json` / `mcp.json` (policy for plain app repos); HR ERP uses the repo-specific check above.

## Operator loop

1. Load [agent-team-map.md](../docs/meta/agent-team-map.md)
2. `npm run governance:lint` → tier + required lanes
3. `npm run governance:plan` → DAG JSON for handoff
4. `/multitask` · `/worktree` per [orchestrator-hr-erp.mdc](rules/orchestrator-hr-erp.mdc)
5. `npm run governance:ci` before merge

Hook status: `npm run governance:hooks:status`
