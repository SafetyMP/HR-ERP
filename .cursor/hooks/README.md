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

When `preToolUse` is inert, **beforeSubmitPrompt** enforces counsel via [counsel-fallback.mjs](./counsel-fallback.mjs). Shadow: `GOVERNANCE_COUNSEL_FALLBACK=shadow`.

## Operator checklist

[docs/meta/harness-operator-checklist.md](../../docs/meta/harness-operator-checklist.md)
