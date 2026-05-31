# QA chaos playbook

Canonical: [docs/QA.md](../../../docs/QA.md)

## First read

1. [docs/QA.md](../../../docs/QA.md) — commands, layout, CI seed, RLS notes
2. [specs/templates/qa-plan.md](../../../specs/templates/qa-plan.md) — per-feature plan + `FAILURE_SUMMARY`
3. [CONTRIBUTING.md](../../../CONTRIBUTING.md) — synthetic-data policy

## Principles

- **Legally plausible absurdity** — realistic jurisdictions, leave stacks; avoid trivial contradictions.
- **Deterministic chaos** — seeded RNG, injected clocks, explicit barriers; no wall-clock race luck in CI.
- **Evidence-first failures** — attach filled `FAILURE_SUMMARY` for agent handoff.

## Repo layout

| Area | Path |
| --- | --- |
| Factories + tags | `tests/fixtures/employees/` |
| Generated mega-batches | `tests/generated/` (gitignored) |
| Clock + concurrency | `lib/qa/` |
| Unit / integration / e2e | `tests/unit/domain/`, `tests/integration/workflows/`, `tests/e2e/` |
| Scenario correlation UI | `src/app/qa-lab/page.tsx` |

## Workflows

### Synthetic data

- Factories and curated JSON only; no real government IDs or prod dumps.
- Large batches: `npx tsx scripts/qa-generate-fixture-batch.ts --seed=… --count=…`

### Temporal / concurrency

- Unit: `FakeClock` + `parallelDuplicateBarrier`
- Integration: parallel mutations + DB uniqueness; RLS via `SET LOCAL` / `set_config('app.tenant_id', …, true)`
- E2E: stable `scenarioId` via `/qa-lab?scenarioId=`

### Failure handoff

On failure, paste block from docs/QA.md or `npm run qa:failure-envelope`.

## Coordination

- EmployeeScenario factories, FakeClock, duplicate-submit races
- Layered Vitest (unit/integration) + Playwright e2e
- Postgres RLS session setup for integration tests
- CI sharding seeds
- Jurisdiction assumptions must match counsel-approved matrices (`@hr-regulated-domain`)
