# Agent governance ALARP

Reduce **as low as reasonably practicable** the risk of false assurance from the in-repo agent harness (shadow-only orchestration, fixture-only CI, production demo-auth gaps).

| Artifact | Purpose |
|----------|---------|
| [orchestrator-handoff.json](./orchestrator-handoff.json) | T3 delegated plan + collaboration record |
| [runtime-audit-2026-06-01.md](./runtime-audit-2026-06-01.md) | Human-readable harness health audit |
| [audit-latest.json](./audit-latest.json) | Machine output from `npm run governance:audit:write` |

## Verify

```bash
npm run governance:audit
npm run governance:audit:write
npm run governance:ci
```

Regenerate `audit-latest.json` after local IDE sessions that exercise hooks. Report includes `enforcement.behaviorScore` and `recommendedProfile` (strict is opt-in; see operator checklist).

Operator checklist: [docs/meta/harness-operator-checklist.md](../../docs/meta/harness-operator-checklist.md)
