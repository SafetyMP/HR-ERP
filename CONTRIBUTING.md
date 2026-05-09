# Contributing

## Community path (Developer Advocate)

For docs-only updates, external PR coaching, or turning a filed bug into an Orchestrator-ready handoff:

- Cursor / maintainers may use **`@hr-developer-advocate`** — [`.cursor/skills/hr-developer-advocate/SKILL.md`](.cursor/skills/hr-developer-advocate/SKILL.md) — together with **`agent-developer-advocate`** ([`.cursor/rules/agent-developer-advocate.mdc`](.cursor/rules/agent-developer-advocate.mdc)).
- **Merge bar unchanged:** substantive PRs still need lint/tests, evidence in [`.github/pull_request_template.md`](.github/pull_request_template.md), and the same Security (`agent-security`) and Code Health (`agent-code-health`) posture as internal work—the advocate adds clarity and appreciation, **not** exceptions.
- **Bug handoffs:** JSON shape lives under [`specs/templates/orchestrator-human-issue-handoff.schema.json`](specs/templates/orchestrator-human-issue-handoff.schema.json); see **[`docs/community/README.md`](docs/community/README.md)** for the human-readable flow.

## Branches

- Prefer `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.

## Agent + human workflow

1. Read `AGENTS.md` — follow orchestration + Definition of Done (`.cursor/rules/orchestrator.mdc` is always-on for Cursor agents).  
2. For product scope, Feature briefs, UAC, or UX friction gates, use the project skill [`.cursor/skills/hr-product-owner/SKILL.md`](.cursor/skills/hr-product-owner/SKILL.md) (or `@hr-product-owner`) so every agent shares the same PO contract.  
3. For **AI ethics, HITL, screening/scoring, or `docs/ai-governance/` / `lib/governance/`**, attach [`.cursor/skills/hr-ai-data-governance/SKILL.md`](.cursor/skills/hr-ai-data-governance/SKILL.md) (`@hr-ai-data-governance`) and **agent-ai-governance** on delegated Tasks when the orchestrator step applies.  
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

## Secrets

- Never commit secrets. Use `.env` locally (gitignored); start from `.env.example`.

## npm install failures (`ENOTEMPTY`, `tar ENOENT`)

If installs repeatedly fail under **Downloads** (especially with **iCloud / Desktop & Documents sync**), clone or copy the repo to a local-only folder (for example `~/Developer/hr-erp`), stop overlapping installs, then run **`npm install`** once.

Architecture contract lint (`npm run contracts:buf` / `contracts:openapi`) uses **`npx`** and does not require a healthy full install.

## Incidents / break-glass (placeholder)

- Production key owners & rotation: **TBD** — document in runbook when live.
