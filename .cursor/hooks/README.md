# Cursor governance hooks

Hooks are registered in [`.cursor/hooks.json`](../hooks.json). Mode: `GOVERNANCE_HOOK_MODE` or [hook-mode.json](../governance/hook-mode.json).

## `/multitask` lane tags

Subagent prompts should include an explicit lane so session state records correctly:

```text
function: counsel — readonly review of regulated paths for …
function: builder — implement …
```

Without `function: <lane>`, `inferFunctionFromTask` may mis-label `explore` subagents.

## Counsel before builder (T3+)

When `preToolUse` is inert, **beforeSubmitPrompt** enforces counsel via [counsel-fallback.mjs](./counsel-fallback.mjs). Shadow: `GOVERNANCE_COUNSEL_FALLBACK=shadow`. After `preToolUseDenyT3From`, if `preToolUse` fires, counsel-fallback defers to avoid double deny.

## Enforcement profiles

Resolver: [enforcement-profile.mjs](./enforcement-profile.mjs). Default **`balanced`** (stop advisory). **`strict`** hard-denies on T3+ missing `counsel` / `sentinel` / `ai_governance_reviewer` at session stop.

Override: `GOVERNANCE_ENFORCEMENT_PROFILE`, `.cursor/hooks-output/enforcement-profile.json`, or `enforcementProfile` on `orchestrator-handoff.json`. Audit: `npm run governance:audit:write` (`behaviorScore`, `recommendedProfile`; auto-demote only).

## Operator checklist

[docs/meta/harness-operator-checklist.md](../../docs/meta/harness-operator-checklist.md)
