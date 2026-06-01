# Cursor 3 native runtime — HR ERP operator guide

Operator guide for **Cursor 3.0–3.2** native agent runtime aligned with ADR [0011](../../specs/alignment/decisions/0011-function-lane-orchestration.md) function lanes. Process enforcement lives in [`.cursor/hooks.json`](../../.cursor/hooks.json); this doc maps **lanes → native commands**.

**Prerequisites:** Cursor 3.2+, Agents Window (`Cmd+Shift+P → Agents Window`).

## Operator loop (every T1+ session)

0. **Collaboration plane:** phases 1–3 per [collaboration-plan.md](../../specs/templates/collaboration-plan.md) and `@hr-human-collaboration` (Harness HITL — not Product HITL)
1. Load [agent-team-map.md](agent-team-map.md) (team roster)
2. `npm run governance:lint` → tier + **Required lanes**
3. `npm run governance:plan` → machine DAG for handoff / hooks
4. `/multitask` or `/worktree` per lane table below
5. T2+: `specs/**/orchestrator-handoff.json` matching Required lanes
6. `npm run governance:ci` before merge

Hook rollout dates: [hook-rollout-schedule.md](hook-rollout-schedule.md). Cloud T4: [cursor-cloud-agents.md](../operations/cursor-cloud-agents.md).

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
| `subagentStart` / `subagentStop` | Lane state → `session-lane-state.json` |
| `beforeSubmitPrompt` | PO + Collaboration inject **on tier/path/gap change**; compact reminder every N messages; governance-lint cached until git fingerprint changes ([hook-dynamic.mjs](../../.cursor/hooks/hook-dynamic.mjs)) |
| `preToolUse` (Task) | T3+ counsel gate; Collaboration specialized-skill gate |
| `stop` | PR stub + `lane-gap-report.json` |

## Foundation rearchitecture (ADR 0016–0020)

Five-plane harness: **policy** · **collaboration (Harness HITL)** · **runtime** · **evidence** · **adaptation**. See [ADR 0020](../../specs/alignment/decisions/0020-collaboration-plane-harness-hitl.md).

Cursor IDE lacks LangGraph-grade durable mid-turn interrupt; T3+ uses git-tracked handoff `revalidationConfirmed` as durable backstop.

### Plan Mode + Collaboration bridge

1. Plan Mode (`Shift+Tab`) → save `.cursor/plans/*.md` using [collaboration-plan.md](../../specs/templates/collaboration-plan.md)
2. Human approves strategy (phase 3) and revalidation (phase 5)
3. `npm run governance:plan` → machine DAG + `collaborationPlan` JSON
4. After phase 6 specialized tools → `/multitask`
5. Phase 7: verifier output review vs `humanDecisionRecord`

### Worktree + cloud verify

- [`.cursor/worktrees.json`](../../.cursor/worktrees.json) — `npm ci` + `.env` copy on `/worktree`
- [`.cursor/environment.json`](../../.cursor/environment.json) — Cloud Agent `install` + **`verify`: `npm run governance:ci`**

PO gate accepts Plan Mode / collaboration-plan artifact for harness/meta work (see `@hr-foundation-governance`).

### Automations catalog (release_ops)

| Automation | Trigger | Action |
|------------|---------|--------|
| `governance-pr-body-lint` | GitHub PR opened (T2+) | [.github/workflows/governance-pr-autofill.yml](../../.github/workflows/governance-pr-autofill.yml) — strict `pr-body`; optional Cursor Automation mirror |
| `governance-drift-weekly` | Cron weekly | `governance:sync-check` + reflect dry-run ([workflow](../../.github/workflows/governance-drift-weekly.yml)) |
| `t4-swarm-handoff` | Webhook | Cloud multitask for T4 |

Configure at [cursor.com/automations](https://cursor.com/automations). No `auto_apply` on T2+ code paths.

### Operator commands

```bash
npm run governance:lint
npm run governance:plan
npm run governance:ci              # diff --strict + handoff --discover + schema fixture
npm run governance:sync-check      # global vs repo manifest (warn)
npm run governance:hooks:status
```

Industry mapping: [cursor-industry-alignment.md](cursor-industry-alignment.md).

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

**Hooks vs permissions:** `~/.cursor/permissions.json` controls auto-run allowlists; hooks (`beforeShellExecution`, `preToolUse`) enforce conditional policy. Do not duplicate the same rule in both without documenting precedence (hooks win on conflict).

## Related

- [cursor-capability-baseline.md](cursor-capability-baseline.md) — pre-unlock audit
- [cursor-3-native-runtime.md](cursor-3-native-runtime.md) — operator guide + lint CLI
- [hook-rollout-schedule.md](hook-rollout-schedule.md) — v4 enforce dates
- [global-agent-governance-overlay.md](global-agent-governance-overlay.md) — manifest v4 sync
