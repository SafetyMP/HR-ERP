# Cursor capability baseline — HR ERP (2026-05-28 audit)

Baseline inventory before Cursor 3 native runtime unlock. See [cursor-3-native-runtime.md](cursor-3-native-runtime.md) for the target operating model.

## Always-on rule context cost

Measured at implementation time (bytes / lines):

| Rule | Bytes | Lines | alwaysApply |
|------|------:|------:|:-----------:|
| `~/.cursor/rules/core-orchestrator.mdc` | 3,175 | 68 | yes (global) |
| `.cursor/rules/orchestrator.mdc` | 1,194 | 19 | yes |
| `.cursor/rules/orchestrator-hr-erp.mdc` | 3,130 | 48 | yes |
| `.cursor/rules/repo-boundaries.mdc` | 1,001 | 24 | yes |
| **Total (pre-unlock)** | **8,500** | **159** | |

Approximate token load: **~2,100 tokens/turn** from always-on prose alone (≈4 chars/token). Target post-unlock: **≤1,000 tokens** (hooks + slim orchestrator + repo-boundaries only).

### Post-unlock (implemented)

| Rule | Bytes | Lines |
|------|------:|------:|
| `~/.cursor/rules/core-orchestrator.mdc` | ~1,800 | ~45 |
| `.cursor/rules/orchestrator.mdc` | 335 | 12 |
| `.cursor/rules/orchestrator-hr-erp.mdc` | 1,521 | 38 |
| `.cursor/rules/repo-boundaries.mdc` | 1,001 | 24 |
| **Project subtotal** | **2,857** | **74** |

Process enforcement moved to [`.cursor/hooks.json`](../../.cursor/hooks.json) (shadow default).

## Harness vs Cursor 3.2 capability matrix

| Cursor 3.2 native | HR ERP pre-unlock | Gap |
|-------------------|-------------------|-----|
| Agents Window + `/multitask` | Manual Task tool DAG in rules | Not documented in repo |
| `/worktree` isolation | Branch discipline in prose only | No native command mapping |
| Multi-root workspaces | Single repo root | Cross-package edits retarget agent |
| `.cursor/hooks.json` | None | Process enforced via always-on rules |
| `.cursor/mcp.json` | None | Per-machine MCP drift |
| Cloud handoff | Not referenced | T4 swarms stop when laptop closes |
| `/best-of-n` | ADR 0010 premium exemption (prose) | No structured audit trail |
| `Await` tool | Not referenced | Long CI/migration jobs not monitored |
| Automations (GitHub/Slack) | `governance:ci` in reusable-ci only | No PR body auto-fill |
| Plugin marketplace | Global skills in `~/.cursor/skills/` | Not pinned per repo |

## Internal harness contradictions (pre-unlock)

1. **Max 2 skill bodies** vs `implementation` taskBundle listing 3 skills (`hr-product-gate`, `lint-and-validate`, `cc-skill-security-review`).
2. **ADR 0011 parallel DAG** vs ADR 0010 T1 row and PR template linear Agent sign-off.
3. **`governance:ci` diff leg** non-blocking; only PR body prose fails CI.
4. **Dual manifest** (`~/.cursor/governance/` vs `.cursor/governance/`) — CI uses repo pin only.
5. **`agent-security.mdc`** glob `**/*.{ts,tsx,prisma,md}` — security lane on nearly every edit.

## What stays strict (non-negotiable)

From [repo-boundaries.mdc](../../.cursor/rules/repo-boundaries.mdc) and ADR 0010/0011:

- Payroll never mutates Core HR DB
- Single writer per aggregate; no cross-DB FKs
- Forward-only migrations
- Sentinel on security plane; counsel on T3 regulated paths
- T4 Human merge gate
- Strict `governance:ci` on merge (outcomes, not prompt prose)

## Unlock artifacts (this implementation)

| Artifact | Purpose |
|----------|---------|
| [cursor-3-native-runtime.md](cursor-3-native-runtime.md) | Lane → native command playbook |
| `.cursor/hooks.json` + `.cursor/hooks/` | Machine-enforced governance (shadow → enforce) |
| `.cursor/mcp.json` | Team MCP allowlist |
| `governance-manifest.yaml` v3 | `runtimeProfile: cursor-3-native`, `maxSkillBodies: 3` |
| `scripts/governance-generate-pr-body.mjs` | PR template auto-fill |
| `scripts/copilot-mcp-server.ts` | Product MCP Phase 3 transport scaffold |
