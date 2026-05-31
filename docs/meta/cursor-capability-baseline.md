# Cursor capability baseline — HR ERP (2026-05-28 audit, updated 2026-05-31)

Baseline inventory before Cursor 3 native runtime unlock. **Current operator model:** [cursor-3-native-runtime.md](cursor-3-native-runtime.md) · [agent-team-map.md](agent-team-map.md).

## Always-on rule context cost

| Rule | Role | alwaysApply |
|------|------|:-----------:|
| `~/.cursor/rules/core-orchestrator.mdc` | Global tier taxonomy | yes |
| `~/.cursor/rules/core-dynamic-skills.mdc` | JIT skill contract (no catalog dumps) | yes |
| `.cursor/rules/orchestrator-hr-erp.mdc` | Repo quick start + team map link | yes |
| `.cursor/rules/repo-boundaries.mdc` | Domain invariants | yes |

Process enforcement lives in [`.cursor/hooks.json`](../../.cursor/hooks.json) (`enforce` per [hook-mode.json](../../.cursor/governance/hook-mode.json)). Target: ≤1k tokens from always-on project rules; global skill index at `~/.cursor/skills/README.md`; framework facades load JIT via `pathTriggers`.

## Harness vs Cursor 3.2 capability matrix (post-unlock)

| Cursor 3.2 native | HR ERP status |
|-------------------|---------------|
| Agents Window + `/multitask` | Documented — [cursor-3-native-runtime.md](cursor-3-native-runtime.md) |
| `/worktree` isolation | [worktrees.json](../../.cursor/worktrees.json) + custodian lane |
| Multi-root workspaces | Documented (payroll-calc, contracts, services) |
| `.cursor/hooks.json` | Implemented — sessionStart, preToolUse, stop, etc. |
| `.cursor/mcp.json` | Team MCP allowlist |
| Cloud handoff | [cursor-cloud-agents.md](../operations/cursor-cloud-agents.md) + [environment.json](../../.cursor/environment.json) |
| `/best-of-n` | ADR 0010 premium repair |
| `Await` | Documented in native runtime guide |
| PR body autofill | [governance-pr-autofill.yml](../../.github/workflows/governance-pr-autofill.yml) |
| Plugin marketplace | Lane `allowedPlugins` in manifest v4 |

## Resolved contradictions (2026-05-31)

1. **Max skill bodies** — manifest v4: 3 bodies; `@skill-router` tier-gated.
2. **Parallel DAG** — ADR 0011 + `delegatedTaskPlan` validation in `governance:ci`.
3. **`governance:ci`** — blocking diff, handoff, team-map, agent-rules sync.
4. **Dual manifest** — `governance:sync-check:strict` available; CI uses repo pin.
5. **Advocate lane** — T1 `@hr-contributor-handoff` (not T4 FinOps).
6. **Dynamic skills** — `core-dynamic-skills.mdc` + manifest `frameworkSkills`; hooks inject `suggestedSkills`; `skillsLoaded[]` telemetry.

## What stays strict (non-negotiable)

From [repo-boundaries.mdc](../../.cursor/rules/repo-boundaries.mdc) and ADR 0010/0011:

- Payroll never mutates Core HR DB
- Single writer per aggregate; no cross-DB FKs
- Forward-only migrations
- Sentinel on security plane; counsel on T3 regulated paths (date-gated deny: [hook-rollout-schedule.md](hook-rollout-schedule.md))
- T4 Human merge gate
- Strict `governance:ci` on merge

## Unlock artifacts

| Artifact | Purpose |
|----------|---------|
| [cursor-3-native-runtime.md](cursor-3-native-runtime.md) | Operator loop + lane → native commands |
| [agent-team-map.md](agent-team-map.md) | Canonical lane ↔ skill roster |
| [hook-rollout-schedule.md](hook-rollout-schedule.md) | v4 staged enforce dates |
| `.cursor/hooks.json` + hooks/ | Machine-enforced governance |
| `governance-manifest.yaml` v4 | `runtimeProfile: cursor-3-native` |
| [governance-sync-agent-rules.mjs](../../scripts/governance-sync-agent-rules.mjs) | Manifest ↔ agent-*.mdc sync |
