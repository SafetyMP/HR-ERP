# ADR 0016: Agent harness foundation rearchitecture

**Date:** 2026-05-30  
**Status:** Accepted  
**Deciders:** Human Lead, Orchestrator  
**Tags:** agents, governance, cursor, hooks, manifest-v4  
**Supersedes:** Manifest v3 semantics only; [ADR 0010](0010-agent-risk-tier-governance.md) tiers and [ADR 0011](0011-function-lane-orchestration.md) lanes remain canonical

## Context

Manifest v3 + hooks (enforce since 2026-05-28) improved safety (shell/MCP) but orchestration discipline remained largely procedural: lane fan-out, PO checkpoints, and counsel-before-builder were injected or logged, not denied. CI validated an example handoff, not discovered production handoffs. Plan JSON ignored `executionGraph.regulated`.

Industry guidance (Cordum L3, NIST AI RMF Agentic Profile, CSA Autonomy Levels) expects pre-dispatch policy, approval binding, and immutable run evidence for production agents.

## Decision

Adopt a **three-plane harness**:

| Plane | Artifacts | Role |
|-------|-----------|------|
| **Policy** | `governance-manifest.yaml` v4, overlay, ADRs | Machine-readable tiers, lanes, triggers, bundles |
| **Runtime** | `.cursor/hooks.json`, session lane state | Stateful enforcement in IDE; cloud partial parity |
| **Evidence** | `governance-lint`, handoffs, PR body, audit log | Merge-blocking proof for T3/T4 |

### Manifest v4

- `schema: governance-manifest/v4`
- Foundation path trigger for harness/meta work (T3)
- `implementation` taskBundle split into `implementation_core` + `implementation_security`
- Skill: `hr-foundation-governance`

### Balanced enforcement matrix

| Tier | IDE hooks | CI / PR |
|------|-----------|---------|
| T0 | Chore checklist inject | `governance:lint` pass |
| T1–T2 | PO inject; lane gaps advisory | PR `riskTier`; golden thread; advisory gaps |
| T3 | `preToolUse` deny missing counsel/sentinel on Task | Handoff `--discover --strict`; MCP protect-mcp |
| T4 | T3 + finops nudge | Human merge gate label; swarm post-mortem stub |

**Always hard:** destructive shell; non-allowlisted MCP; payroll/Core HR invariants ([repo-boundaries.mdc](../../../.cursor/rules/repo-boundaries.mdc)).

### Compliance posture enum

Handoffs and PRs may declare `compliancePosture`:

- `NIST AI RMF`
- `EU AI Act employment-AI`
- `ISO 42001-ready`

Regulated paths default to stricter gates (counsel, HITL, audit retention).

### Agent registry fields (handoff v4)

Optional evidence fields aligned with NIST Agentic Profile:

- `delegationDepth` — subagent chain depth
- `toolClasses` — MCP/tool exposure classes used
- `principal` — accountable human or service identity

### IDE vs cloud hook matrix

| Hook | IDE | Cloud agent | Harness action |
|------|-----|-------------|----------------|
| `beforeShellExecution` | Yes | Yes | Destructive git/db block |
| `preToolUse` / `subagentStop` | Yes | Yes | Lane state machine |
| `beforeMCPExecution` | Yes | Not yet | CI + Cedar at merge |
| `beforeSubmitPrompt` / `stop` | Yes | Not yet | PR stub + Automations |
| `sessionStart` | Yes | N/A | Initialize lane state |

T3/T4 evidence gates are **CI-enforced** for cloud paths until MCP/stop hooks ship in cloud VMs.

### Cursor native unlock

Committed in repo:

- `.cursor/worktrees.json` — custodian DDL isolation
- `.cursor/environment.json` — cloud agent verify loop
- Plan Mode bridge — `.cursor/plans/*.md` accepted for harness/meta PO gate
- Automations catalog — documented in [cursor-3-native-runtime.md](../../../docs/meta/cursor-3-native-runtime.md)

## Success metrics

| Metric | Target |
|--------|--------|
| Always-on rule context | ≤ 1,000 tokens |
| T3+ PRs with real handoff | 100% discover + lane-complete |
| Regulated plan JSON | Matches `executionGraph.regulated` |
| Global skill lock | Present; CI validates via `governance:sync-check` |

## Non-goals

- Replace Cursor `/multitask`, `/worktree`, `/best-of-n`, Agents Window, or Automations
- Re-expand to 15 always-loaded skills
- Hard-block T1 scout/architect on every edit
- Change product inference tiers (A/B/C)
- `auto_apply: true` on Automations for T2+ code paths

## Consequences

**Positive:** Cordum L3-aligned evidence chain; regulated DAG correctness; cloud verify path; industry audit mapping.

**Negative:** T3+ contributors must maintain handoff JSON; global skill lock may warn on drift until machines sync.

## References

- [cursor-industry-alignment.md](../../../docs/meta/cursor-industry-alignment.md)
- [cursor-3-native-runtime.md](../../../docs/meta/cursor-3-native-runtime.md)
- [0010-agent-risk-tier-governance.md](0010-agent-risk-tier-governance.md)
- [0011-function-lane-orchestration.md](0011-function-lane-orchestration.md)
- Cordum Agent Governance Maturity Model (L3 production bar)
- NIST AI RMF Agentic Profile (CSA, 2025)
- [Cursor Hooks docs](https://cursor.com/docs/agent/hooks)
