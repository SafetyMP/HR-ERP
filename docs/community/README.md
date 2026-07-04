# Community & contributor experience

Thank you for investing time in this project. HR ERP is maintained as an **evergreen open source reference** for HR SaaS patterns and agent-governed development — see [evergreen-open-source-positioning.md](../meta/evergreen-open-source-positioning.md). Whether you are fixing a typo, improving onboarding docs, or tracing a tricky bug, **your contribution matters**.

Maintainers: after the first green Actions run, mirror required checks from [**`github-branch-protection.md`**](github-branch-protection.md). For the GitHub About panel, README badges, and the demo image, see [**`github-presentation.md`**](github-presentation.md).

## How we triage

1. **Issues** — Describe what you expected, what happened, and how to reproduce. Use the [bug report](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository) template when available. We only use **synthetic** data in repros and fixtures (no real employee or tax data).

2. **Open-ended questions** — Setup, architecture, or "how does this work" questions go through the [documentation issue template](../../.github/ISSUE_TEMPLATE/documentation.yml) (GitHub Discussions is not enabled). Never post undisclosed vulnerabilities as issues — use [`SECURITY.md`](../../SECURITY.md).

3. **Pull requests** — We follow the checklist in [`.github/pull_request_template.md`](../../.github/pull_request_template.md). Docs-only edits can use the [lightweight PR path](../../CONTRIBUTING.md#lightweight-prs-docs-only). Maintainers and automation aim for feedback that is **clear, kind, and actionable**: blocking findings are labeled as such; suggestions stay optional.

4. **Agents** — Cursor and delegated tasks often use orchestrated skills documented in [`AGENTS.md`](../../AGENTS.md). That keeps security, compliance, and QA expectations consistent—**not** to replace human reviewers.

## From natural language bug to Implementation

Maintainers may attach a machine-readable handoff alongside your issue so implementation agents receive a precise briefing:

| Artifact                                                                                                                               | Purpose                           |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [`specs/templates/orchestrator-human-issue-handoff.schema.json`](../../specs/templates/orchestrator-human-issue-handoff.schema.json)   | JSON Schema for validated tickets |
| [`specs/templates/orchestrator-human-issue-handoff.example.json`](../../specs/templates/orchestrator-human-issue-handoff.example.json) | Fictional example (no PII)        |

Validate locally when tooling is installed, for example:

```bash
npx --yes ajv-cli validate -s specs/templates/orchestrator-human-issue-handoff.schema.json -d handoff.json
```

## Developer Advocate skill

Agents or maintainers coordinating contributor experience load **`@hr-contributor-handoff`** ([`.cursor/skills/hr-contributor-handoff/SKILL.md`](../../.cursor/skills/hr-contributor-handoff/SKILL.md)) with **agent-developer-advocate**. That skill **does not** waive security reviews, tests, or Product Owner checkpoints for real features—it keeps tone collaborative while routing work through the same gates everyone else uses.
