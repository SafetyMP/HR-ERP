# Community & contributor experience

Thank you for investing time in this project. Whether you are fixing a typo, improving onboarding docs, or tracing a tricky bug, **your contribution matters**.

## How we triage

1. **Issues** — Describe what you expected, what happened, and how to reproduce. Use the [bug report](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository) template when available. We only use **synthetic** data in repros and fixtures (no real employee or tax data).

2. **Pull requests** — We follow the checklist in [`.github/pull_request_template.md`](../../.github/pull_request_template.md). Maintainers and automation aim for feedback that is **clear, kind, and actionable**: blocking findings are labeled as such; suggestions stay optional.

3. **Agents** — Cursor and delegated tasks often use orchestrated skills documented in [`AGENTS.md`](../../AGENTS.md). That keeps security, compliance, and QA expectations consistent—**not** to replace human reviewers.

## From natural language bug to Implementation

Maintainers may attach a machine-readable handoff alongside your issue so implementation agents receive a precise briefing:

| Artifact | Purpose |
|----------|---------|
| [`specs/templates/orchestrator-human-issue-handoff.schema.json`](../../specs/templates/orchestrator-human-issue-handoff.schema.json) | JSON Schema for validated tickets |
| [`specs/templates/orchestrator-human-issue-handoff.example.json`](../../specs/templates/orchestrator-human-issue-handoff.example.json) | Fictional example (no PII) |

Validate locally when tooling is installed, for example:

```bash
npx --yes ajv-cli validate -s specs/templates/orchestrator-human-issue-handoff.schema.json -d handoff.json
```

## Developer Advocate skill

Agents or maintainers coordinating contributor experience load **`hr-developer-advocate`** ([`.cursor/skills/hr-developer-advocate/SKILL.md`](../../.cursor/skills/hr-developer-advocate/SKILL.md)). That skill **does not** waive security reviews, tests, or Product Owner checkpoints for real features—it keeps tone collaborative while routing work through the same gates everyone else uses.
