# Hook rollout schedule (v4)

Canonical config: [`.cursor/governance/hook-mode.json`](../../.cursor/governance/hook-mode.json)

Check current mode: `npm run governance:hooks:status`

## Dates

| Date | Key | Effect |
|------|-----|--------|
| 2026-05-28 | `enforceAfter` | Global hook mode → enforce (unless `GOVERNANCE_HOOK_MODE` override) |
| 2026-06-06 | `laneStateShadowUntil` ends | Session lane state authoritative for gap reports |
| 2026-06-13 | `handoffDiscoverStrictFrom` | T2+ diffs must have discoverable `specs/**/orchestrator-handoff.json` |
| 2026-06-20 | `preToolUseDenyT3From` | T3+ builder Tasks **denied** until counsel lane started ([pre-tool-use.mjs](../../.cursor/hooks/pre-tool-use.mjs)) |
| 2026-06-28 | `routerHintsEnforceFrom` | Adaptation router hints shadow → enforce |

## Pre-rollout practice (now)

1. Every harness/meta PR: handoff JSON with all **Required lanes** from `npm run governance:lint`
2. T3 regulated work: run readonly `counsel` Task before builder (even before June 20)
3. Session start injects operator loop — complete lint → plan before `/multitask`

## Counsel-before-builder

Implemented in `pre-tool-use.mjs`:

- Before `preToolUseDenyT3From`: logs + ledger signal; allows builder with hook note
- On/after date in enforce mode: denies Task until counsel appears in lane state

Critical lanes for T3+: `counsel`, `sentinel`, `ai_governance_reviewer` ([lane-state.mjs](../../.cursor/hooks/lane-state.mjs)).

## Related

- [cursor-3-native-runtime.md](cursor-3-native-runtime.md)
- [agent-team-map.md](agent-team-map.md)
