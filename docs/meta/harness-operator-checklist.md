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

## Enforcement profiles (graduated strict)

Default **`balanced`**: counsel deny on submit; **stop is advisory** (no retry loops).

**`strict`** (high-stakes T3 only): stop **hard-denies** when critical lanes (`counsel`, `sentinel`, `ai_governance_reviewer`) are still missing. Expect extra stop-time retries and token cost.

| Activate strict | Command / artifact |
|-----------------|-------------------|
| One session | `GOVERNANCE_ENFORCEMENT_PROFILE=strict` |
| Team default (local IDE) | `.cursor/hooks-output/enforcement-profile.json` via L2 promote stub |
| Feature intent | `enforcementProfile: "strict"` on `orchestrator-handoff.json` |

```bash
npm run governance:audit:write   # behaviorScore + recommendedProfile (never auto-promotes strict)
```

Audit may **auto-demote** strict → balanced after grade F, ≥2 critical findings, or low score two weeks running. Counsel fallback stays on for T3 builder intent in all profiles.

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
