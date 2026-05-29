# Cursor 3 native runtime — HR ERP operator guide

Operator guide for **Cursor 3.0–3.2** native agent runtime aligned with ADR [0011](../../specs/alignment/decisions/0011-function-lane-orchestration.md) function lanes. Process enforcement lives in [`.cursor/hooks.json`](../../.cursor/hooks.json); this doc maps **lanes → native commands**.

**Prerequisites:** Cursor 3.2+, Agents Window (`Cmd+Shift+P → Agents Window`).

## Multi-root workspace (3.2)

Add folders to one Agents Window session:

1. HR ERP repo root
2. `packages/payroll-calc`
3. `contracts/`
4. `services/`

Enables cross-package edits without retargeting the agent. See [Cursor 3.2 changelog](https://cursor.com/changelog/04-24-26).

## Lane → native command mapping

| ADR 0011 lane | When | Native invocation |
|---------------|------|-------------------|
| scout + architect | T1+ greenfield | `/multitask` — two prompts: (1) explore codebase paths, (2) readonly architecture spec |
| custodian | DDL / migrations (T2+) | `/worktree` — isolated branch; run migrations; `Await` on `npm run db:verify` |
| builder | Implementation | Foreground agent or worktree promote after custodian |
| sentinel + verifier | Post-builder | `/multitask` — readonly security review + test plan |
| counsel | T3 pay/compliance | Readonly subagent via `/multitask`; does not block builder on non-regulated paths |
| ai_governance_reviewer | `lib/copilot/**` | Readonly; co-run with sentinel |
| finops_coordinator | T4 ≥2 subagents | Cloud handoff + `/multitask` queue drain |
| Premium repair | Human-authorized emergency | `/best-of-n` — log authorization in PR; post-hoc ADR within 24h (ADR 0010) |

## Structured plan (hooks + lint)

Before fan-out, emit machine-readable plan:

```bash
node scripts/governance-lint.mjs plan --json
```

The `subagentStart` hook injects tier preamble from this output. Paste into handoff JSON or PR **`delegatedTaskPlan`**.

## Native commands reference

| Command | Release | Use |
|---------|---------|-----|
| `/multitask` | 3.2 | Parallel async subagents |
| `/worktree` | 3.0 | Isolated branch per lane |
| `/best-of-n` | 3.0 | Multi-model comparison (premium repair) |
| `/loop` | 3.0+ | Scheduled CI/governance monitoring |
| Design Mode | 3.0 | `Cmd+Shift+D` — UI annotation in built-in browser |

## Hooks (shadow → enforce)

Canonical schedule: [`.cursor/governance/hook-mode.json`](../../.cursor/governance/hook-mode.json) (`defaultMode`, `enforceAfter`). Override with `GOVERNANCE_HOOK_MODE=shadow|enforce`. IDE `beforeMCPExecution` uses `failClosed: true` when hooks are enabled.

| Hook | Replaces |
|------|----------|
| `beforeShellExecution` | Destructive git/db guardrails in prose |
| `beforeMCPExecution` | MCP allowlist from `.cursor/mcp.json` |
| `subagentStart` | Verbatim Task preamble in every delegation |
| `afterFileEdit` | Post-edit lint reminder |
| `beforeSubmitPrompt` | PO checkpoint injection (T1+) |
| `stop` | PR body stub → `.cursor/hooks-output/pr-body-stub.md` |

## CI alignment

- Merge gate: `npm run governance:ci` (unchanged)
- PR body auto-fill: `npm run governance:pr-body` or GitHub workflow `governance-pr-autofill.yml`
- Local PR check: `node scripts/governance-lint.mjs pr-body --strict --body "$(gh pr view --json body -q .body)"`

## Two MCP planes

| Plane | Config | Governance |
|-------|--------|------------|
| **Cursor IDE** | `.cursor/mcp.json` | Hooks + team allowlist |
| **Product runtime** | `lib/copilot/mcp-server.ts` | Cedar + RBAC; see [hr-copilot-mcp.md](../architecture/hr-copilot-mcp.md) |

Do not conflate IDE MCP plugins with in-app copilot tools.

## Related

- [cursor-capability-baseline.md](cursor-capability-baseline.md) — pre-unlock audit
- [cursor-antigravity-harness.md](cursor-antigravity-harness.md) — lint CLI reference
- [global-agent-governance-overlay.md](global-agent-governance-overlay.md) — manifest v3 sync
