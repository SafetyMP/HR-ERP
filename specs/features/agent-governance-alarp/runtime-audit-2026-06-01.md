# Runtime harness audit — 2026-06-01

**Ticket:** `governance-alarp-full-repo`  
**Handoff:** [orchestrator-handoff.json](./orchestrator-handoff.json)  
**Machine report:** [audit-latest.json](./audit-latest.json) (`npm run governance:audit:write`)

## Verdict

Harness is **partially operational**: shell/MCP safety and PO inject work; **orchestration enforcement does not** bind agent behavior in practice. That explains agents completing T3-shaped work without counsel, sentinel, or verifier lanes.

**Overall grade:** C (policy A, runtime orchestration D). Post-remediation: counsel fallback on `beforeSubmitPrompt`; token-tuned inject — re-run `governance:audit:write`.

## Standards assessed

| Source | Expectation |
|--------|-------------|
| [ADR 0016](../../../specs/alignment/decisions/0016-agent-harness-foundation.md) | Balanced matrix: T3 `preToolUse` deny, CI handoff discover |
| [ADR 0020](../../../specs/alignment/decisions/0020-collaboration-plane-harness-hitl.md) | Revalidation before specialized Tasks |
| [Hook rollout](../../../docs/meta/hook-rollout-schedule.md) | Shadow → enforce dates for lane state, counsel deny |
| [CTQ tree](../../../specs/governance/learning/ctqs/harness-ctq-tree.yaml) | `counsel_before_builder_rate`, `handoff_discover_pass_rate` |

## Evidence summary

Audit of `.cursor/hooks-output/audit.log` (~2.2k lines, enforce mode):

| Hook event | Approx. count | Notes |
|------------|---------------|--------|
| `afterFileEdit` | 1,341 | Reliable |
| `beforeShellExecution` | 448 | Reliable |
| `beforeSubmitPrompt` | 131 | Tier/lane inject |
| `beforeMCPExecution` | 84 | Allowlist |
| `stop` | 154 | Gap report; **advisory only** |
| `subagentStart` | 14 | Lane tracking sparse |
| `subagentStop` | 4 | Last activity 2026-05-31 |
| **`preToolUse`** | **0** | Counsel-before-builder **inert** |

Reflect ([2026-06-01](../../../specs/governance/learning/reports/2026-06-01-reflect.json)): **70 open signals**; top cluster `lane_gap` on `devops_lifecycle` (T3).

## Root causes (ranked)

1. **`preToolUse` never fires** — Task delegation does not reach the hook; deny path unreachable even after 2026-06-20.
2. **`subagentStart`/`subagentStop` rarely fire** — `session-lane-state.json` stays `completed: []`.
3. **`stop` logs `blocked: true` but always `allow()`** — T3 critical gaps are messages, not hard stops.
4. **Rollout still pending** (as of 2026-06-01): lane authority (06-06), handoff discover strict (06-13), collaboration enforce (06-15), counsel deny (06-20).
5. **CI validates fixture handoffs**, not necessarily the active session diff.
6. **Foreground single-agent** pattern skips `/multitask` and handoff JSON.

## Remediation backlog

| ID | Owner lane | Action | Target |
|----|------------|--------|--------|
| ALARP-01 | `release_ops` | Wire `npm run governance:audit` in weekly drift workflow (warn-only → strict) | 2026-06-07 |
| ALARP-02 | `builder` | **`governance-audit.mjs`** + `audit-latest.json` | Done |
| ALARP-03 | `builder` | Fallback counsel gate on `beforeSubmitPrompt` (`counsel-fallback.mjs`) | Done |
| ALARP-06 | `verifier` | [harness-operator-checklist.md](../../../docs/meta/harness-operator-checklist.md) | Done |
| ALARP-04 | `release_ops` | Confirm Cursor IDE fires `preToolUse` for `Task`; file upstream gap if not | 2026-06-10 |
| ALARP-05 | `architect` | Graduated `stop` hard-deny via `enforcementProfiles.strict` (default balanced) | Done |
| ALARP-06 | `verifier` | Add `governance:audit --require-audit-log` to local pre-push doc / dev checklist | 2026-06-06 |
| ALARP-07 | `counsel` | Review cloud agent playbook — no IDE hook parity | Ongoing |

## Operator commands

```bash
npm run governance:hooks:status
npm run governance:audit              # fail on critical findings
npm run governance:audit:write        # refresh audit-latest.json
npm run governance:audit:strict       # fail on warnings too
GOVERNANCE_AUDIT_REQUIRE_LOG=1 npm run governance:audit
```

## Token budget (2026-06-01 implementation)

| Lever | Setting |
|-------|---------|
| `poInjectEveryN` | 10 (was 5) |
| `fullInjectOnMaterialGapsOnly` | true — full inject only for required / T3-critical gaps |
| Warm-cache PO block | One-line checkpoint when plan cached |
| Collaboration lines | Full detail on first inject only |
| `afterFileEdit` | No per-file lint `agent_message`; `builderActivityAt` only |
| Counsel deny | Single-line `beforeSubmitPrompt` deny |

## Graduated enforcement (ALARP-05)

| Profile | Stop on T3 critical gaps | Activation |
|---------|--------------------------|------------|
| `balanced` (default) | Advisory only | — |
| `strict` | Hard deny (`process.exit(2)`) | `GOVERNANCE_ENFORCEMENT_PROFILE=strict`, hooks-output file, handoff field, or L2 stub promote |

`npm run governance:audit:write` emits `behaviorScore` and `recommendedProfile` (never auto-promotes strict). Auto-demote strict → balanced on grade F, ≥2 critical findings, or score &lt; 50 for two consecutive ISO weeks.

## ALARP-04 / preToolUse (rollout 2026-06-20)

**Status:** `preToolUse` still **0 events** in historical `audit.log` — primary counsel gate remains **`beforeSubmitPrompt`** (`counsel-fallback.mjs`). When `preToolUseDenyT3From` is active **and** `preToolUse` fires, counsel-fallback **defers** to avoid double deny. Verify in Cursor: delegate a `Task` subagent and confirm `audit.log` contains `preToolUse` events.

## Acceptance (verifier)

- [x] `counsel-fallback` unit tests + hook-dynamic / handoff-match / enforcement-profile tests
- [x] Graduated enforcement profiles (`enforcement-profile.mjs`, audit `behaviorScore`)
- [ ] `npm run governance:audit` exits 0 when hooks are healthy **or** documents expected failures with `--json`
- [ ] `audit-latest.json` regenerated after IDE sessions used for harness work
- [ ] T3+ merge blocked by counsel fallback or human review when audit shows critical gaps
