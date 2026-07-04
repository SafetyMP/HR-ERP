# Contributing

HR ERP is an **evergreen open source reference** — contributions should preserve honest scope (see [docs/meta/evergreen-open-source-positioning.md](docs/meta/evergreen-open-source-positioning.md)): teach HR SaaS and agent-governed development patterns; do not imply certified payroll or turnkey production HRIS without explicit disclaimers.

## Community standards & security

- **[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)** applies to Issues, discussions, reviews, and project spaces.
- Report **undisclosed vulnerabilities** through **[`SECURITY.md`](SECURITY.md)** (private GitHub Security advisories)—not via public issues.
- **License:** The project is under **[Apache License 2.0](LICENSE)** with attribution in **[`NOTICE`](NOTICE)**. Contributions are expected to be licensed under the same terms unless you explicitly state otherwise.

## Lightweight PRs (docs-only)

Small documentation-only changes do not need the full governance ceremony. If your PR touches **only** copy — a typo, `README.md`, files under `docs/**`, or community docs — you can keep it lightweight:

| Situation                                                                  | What to do                                                                                                                                                                     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Typo, `README.md`, `docs/**`, or community copy only                       | Open the PR and set **`riskTier: T0`** in the PR body.                                                                                                                         |
| Governance sections in the [PR template](.github/pull_request_template.md) | Mark **N/A** — PO checkpoint, golden thread, evidence bundle, and lane sign-offs do not apply to T0 docs.                                                                      |
| Still required                                                             | Use `step 1 chore N/A` for the PO checkpoint; run `npm run lint` if you touched Markdown-adjacent tooling; keep to synthetic data only.                                        |
| **Not** lightweight                                                        | Any change under `src/`, `lib/`, `prisma/`, `packages/`, `services/`, `workers/`, `.github/workflows/`, security, or payroll follows the full merge bar below — no exceptions. |

The **merge bar for substantive work is unchanged**: this path only removes ceremony that has no bearing on a pure copy edit.

## Community path (Developer Advocate)

For docs-only updates, external PR coaching, or turning a filed bug into an Orchestrator-ready handoff:

- Cursor / maintainers may use **`@hr-contributor-handoff`** — [`.cursor/skills/hr-contributor-handoff/SKILL.md`](.cursor/skills/hr-contributor-handoff/SKILL.md) — together with **`agent-developer-advocate`** ([`.cursor/rules/agent-developer-advocate.mdc`](.cursor/rules/agent-developer-advocate.mdc)).
- **Merge bar unchanged:** substantive PRs still need lint/tests, evidence in [`.github/pull_request_template.md`](.github/pull_request_template.md), and the same Security (`agent-security`) and Code Health (`agent-code-health`) posture as internal work—the advocate adds clarity and appreciation, **not** exceptions.
- **Bug handoffs:** JSON shape lives under [`specs/templates/orchestrator-human-issue-handoff.schema.json`](specs/templates/orchestrator-human-issue-handoff.schema.json); see **[`docs/community/README.md`](docs/community/README.md)** for the human-readable flow.

## Branches

- Prefer `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.

## Releases & commit messages

Merged commits on **`main` / `master`** should follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat: …`, `fix: …`, `chore: …`) so [semantic-release](https://github.com/semantic-release/semantic-release) can version [`package.json`](package.json), update [`CHANGELOG.md`](CHANGELOG.md), create **`v*`** tags and GitHub Releases, and trigger container publishing ([`.github/workflows/semantic-release.yml`](.github/workflows/semantic-release.yml), [`.github/workflows/publish-ghcr.yml`](.github/workflows/publish-ghcr.yml)). Prefer **squash merges** with a conventional subject line.

## Agent + human workflow

1. Read `AGENTS.md` — follow orchestration + Definition of Done (`.cursor/rules/orchestrator-hr-erp.mdc` is always-on for Cursor agents).
2. For product scope, Feature briefs, UAC, or UX friction gates, use **`@hr-product-gate`** — see [`.cursor/skills/README.md`](.cursor/skills/README.md).
3. For **AI ethics, HITL, screening/scoring, or `docs/ai-governance/` / `lib/governance/`**, attach **`@hr-regulated-domain`** (AI L3) and **`@hr-product-mcp-governance`** when copilot/MCP paths apply; use **agent-ai-governance** on delegated Tasks when triggered.
4. Confirm phase ADRs under `specs/alignment/decisions/`.
5. Fill templates under `specs/templates/` per change type.
6. PR must complete `.github/pull_request_template.md` with **evidence links** (not checkboxes alone).

## Change size

- Target **≤ ~400 LOC** per PR where possible; split large work with Orchestrator alignment.

## Database

- **Forward-only** migrations; never rewrite applied migration history on shared branches.
- After schema edits: `npm run db:generate`; use `npm run db:push` locally or `npm run db:migrate` once migrations exist.

## Data + tests

- **Synthetic data only** in fixtures: no real SSNs, tax IDs, or production exports; no customer spreadsheets in Git (fixtures live under `tests/fixtures/`; bulky batches → `tests/generated/`, gitignored — see [`docs/QA.md`](docs/QA.md)).
- On CI/local failure: paste the filled **`FAILURE_SUMMARY`** envelope (`specs/templates/qa-plan.md` + [`docs/QA.md`](docs/QA.md)) — CI echoes [`scripts/qa-print-failure-envelope.sh`](scripts/qa-print-failure-envelope.sh) as a reminder.

## Code style

- `npm run lint`
- `npm run format` (Prettier)
- `npm run verify:reference-exit` (static check for reference-customer exit runbook artifacts)

## Secrets

- Never commit secrets. Use `.env` locally (gitignored); start from `.env.example`.

## npm install failures (`ENOTEMPTY`, `tar ENOENT`)

If installs repeatedly fail under **Downloads** (especially with **iCloud / Desktop & Documents sync**), clone or copy the repo to a local-only folder (for example `~/Developer/hr-erp`), stop overlapping installs, then run **`npm install`** once.

Architecture contract lint (`npm run contracts:buf` / `contracts:openapi`) uses **`npx`** and does not require a healthy full install.

## Incidents / break-glass (placeholder)

- Production key owners & rotation: **TBD** — document in runbook when live.

## Dependency updates (Dependabot)

- Automated PRs originate from **[`.github/dependabot.yml`](.github/dependabot.yml)**. Treat them like any other contribution: **green `quality-gate`** + **`security:scan`** on the Dependabot branch.
- **Fully unattended merges** are discouraged for HR-adjacent surfaces; prefer **`deps:automerge`** (or equivalent label) applied by a maintainer after spot review once checks are trustworthy.
- If a Dependabot bump changes native bindings, codegen, or Prisma majors, escalate to QA + Security review norms in [`docs/QA.md`](docs/QA.md) and `.github/pull_request_template.md`.

## New modules (`packages`, `services`, `workers`)

- Land a **`README.md`** with scope, scripts, owning domain (and ADR/feature link if cross-boundary)—see checklist in `.github/pull_request_template.md`.

## Maintainer CI / branch checklist

[`docs/community/github-branch-protection.md`](docs/community/github-branch-protection.md) captures required GitHub Rules / Environment settings for `main` (status checks tied to **`quality-gate`** + **`Deploy production`**).
