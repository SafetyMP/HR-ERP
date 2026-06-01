# Harness operator checklist

Local IDE workflow for [cursor-3-native-runtime.md](./cursor-3-native-runtime.md). Machine check: `npm run governance:audit`.

## Session start (T1+)

1. Read [agent-team-map.md](./agent-team-map.md).
2. `npm run governance:lint` → note tier and required lanes.
3. `npm run governance:plan` → paste `delegatedTaskPlan` into `specs/features/<feature>/orchestrator-handoff.json`.
4. T3+ regulated work: `/multitask` with **`function: counsel`** (readonly) before builder.

## During work

- Subagent prompts: include `function: <lane>` (see [.cursor/hooks/README.md](../../.cursor/hooks/README.md)).
- T3+ implementation prompts without counsel recorded → **blocked** by counsel fallback (`beforeSubmitPrompt`).
- Shadow counsel gate: `GOVERNANCE_COUNSEL_FALLBACK=shadow`.

## Before push / PR

```bash
npm run governance:audit:write
GOVERNANCE_AUDIT_REQUIRE_LOG=1 npm run governance:audit
npm run governance:ci
```

- Paste **Runtime audit** grade from PR template (or `audit-latest.json`).
- T3+: confirm `revalidationConfirmed` and `humanDecisionRecord` in handoff when using specialized skills.

## Handoff per feature

Place `orchestrator-handoff.json` under `specs/features/<name>/` so it **covers** the diff (same folder or `suspectedPaths` globs). After **2026-06-13**, `governance:lint` errors if no handoff covers a T2+ diff.

## Rollout reference

[hook-rollout-schedule.md](./hook-rollout-schedule.md)
