# QA & chaos engineering

Operational guide for **synthetic fixtures**, **layered tests**, **temporal hazards**, and **failure envelopes**. Feature-specific plans still start from [`specs/templates/qa-plan.md`](../specs/templates/qa-plan.md).

## Layout

| Path                                                              | Purpose                                                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [`tests/fixtures/employees/`](../tests/fixtures/employees/)       | `EmployeeScenario` factories, tag overlays, curated JSON                                                             |
| [`tests/generated/`](../tests/generated/)                         | Mega-batches from [`scripts/qa-generate-fixture-batch.ts`](../scripts/qa-generate-fixture-batch.ts) (**gitignored**) |
| [`tests/unit/domain/`](../tests/unit/domain/)                     | Pure rules + fixture determinism                                                                                     |
| [`tests/integration/workflows/`](../tests/integration/workflows/) | Postgres + Prisma + concurrency                                                                                      |
| [`tests/e2e/`](../tests/e2e/)                                     | Playwright — `/qa-lab` correlation surface                                                                           |
| [`lib/qa/`](../lib/qa/)                                           | `Clock`, `parallelDuplicateBarrier`, calendar helpers                                                                |

## Commands

```bash
# Vitest — loads DATABASE_URL from .env via tests/vitest.setup.ts when present.
VITEST_SEED="${GITHUB_RUN_ID:-manual}" npm run test -- --run

# Integration suites skip unless DATABASE_URL is set AND migrations applied
DATABASE_URL="postgresql://hr_erp:hr_erp_dev_password@127.0.0.1:15432/hr_erp" npx prisma migrate deploy
DATABASE_URL="postgresql://hr_erp:hr_erp_dev_password@127.0.0.1:15432/hr_erp" npm run test -- --run tests/integration

# E2E — Playwright starts `npm run dev` unless CI reuse rules apply
npm run test:e2e

# CI e2e prerequisites (reusable-qa `e2e` job): Postgres service, DATABASE_URL,
# `npx prisma migrate deploy`, `npm run demo:bootstrap -- --skip-holiday`, then
# `node scripts/ci-issue-e2e-jwts.mjs --github-env`. Locally: run demo:bootstrap
# before test:e2e when specs need seeded Jordan/manager demo rows.

# CI mints feature UAC JWTs (reusable-qa e2e job)
node scripts/ci-issue-e2e-jwts.mjs

# Deterministic mega-batch → tests/generated/
npx tsx scripts/qa-generate-fixture-batch.ts --seed=12345 --count=5000

# Post-migrate orphan smoke (Prisma app DB — CI integration job runs this after migrate deploy)
npm run db:verify

# Load capped scenarios from generated JSON into Postgres (RLS-aware)
npm run db:load:fixtures -- --file=tests/generated/employees_seed_12345_n_5000.json --max=200
```

Custody / migration playbook: [`architecture/database-migrations-and-state.md`](architecture/database-migrations-and-state.md).

### CI e2e prerequisites

The `e2e` job in [`.github/workflows/reusable-qa.yml`](../.github/workflows/reusable-qa.yml) provisions:

1. `pgvector/pgvector:pg16` service + `DATABASE_URL`
2. `npx prisma migrate deploy`
3. `npm run demo:bootstrap -- --skip-holiday`
4. Minted JWTs via `scripts/ci-issue-e2e-jwts.mjs`

Playwright specs that navigate from `/` only work for links on the current home layout (Paystub, Time, PTO, Benefits, Profile). Prefer `page.goto("/employee/...")` for feature routes. Avoid exact `listitem` counts — scope to `#main-content` or assert on visible copy.

### CI sharding (Vitest)

Vitest `--shard=i/n` splits files across runners (see [`.github/workflows/reusable-qa.yml`](../.github/workflows/reusable-qa.yml), invoked by [`.github/workflows/quality-gate.yml`](../.github/workflows/quality-gate.yml) and [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)). GitHub Actions exports **`VITEST_SEED=${{ github.run_id }}`** so `REPRO` lines stay attributable — paste into [`FAILURE_SUMMARY`](#failure_summary-envelope) blocks.

## Temporal / concurrency patterns

- **Frozen instant duplicates**: combine [`FakeClock`](../lib/qa/clock.ts) + [`parallelDuplicateBarrier`](../lib/qa/parallel-same-instant.ts); persistence tests assert DB unique violations (`P2002`) surface correctly ([integration suite](../tests/integration/workflows/pto-concurrency.integration.test.ts)).
- **DST / timezone**: policy stubs live in [`pto-calendar-policy`](../lib/qa/pto-calendar-policy.ts); replace UTC helpers with counsel-approved zone logic before payroll certification.

## FAILURE_SUMMARY envelope

Any automated failure attached to a PR/issue MUST include this block (canonical copy also lives in [`specs/templates/qa-plan.md`](../specs/templates/qa-plan.md)):

```
FAILURE_SUMMARY: One sentence invariant violated.

REPRO: Commands / test filter / seed value.

INPUT_ARTIFACTS: Scenario IDs + minimal JSON (or hash of mega-batch seed).

EXPECTED: Exact predicate or snapshot fragment.

OBSERVED: Response body / DB row / log excerpt.

STACK_HOT_PATH: Top frames linking domain → adapter → persistence.

ROOT_CAUSE_HYPOTHESIS: Ordering bug vs missing constraint vs wrong TZ vs stale read.

BLAST_RADIUS: Modules/endpoints affected.

FIX_OWNER_HINT: Which subsystem/agent owns rewrite.

NEXT_ARTIFACTS_REQUESTED: e.g., migration adding UNIQUE (employee_id, date); reconciliation job spec.
```

CI prints a shell reminder via [`scripts/qa-print-failure-envelope.sh`](../scripts/qa-print-failure-envelope.sh) — paste and fill before requesting another agent rewrite.

## Synthetic data policy

- No real government IDs, prod dumps, or customer spreadsheets in Git.
- `.qa.local` email domains and `tenant_*` prefixes keep accidental routing obvious.

## E2E correlation surface

[`src/app/qa-lab/page.tsx`](../src/app/qa-lab/page.tsx) renders `?scenarioId=` so Playwright and backend tests can share stable IDs without coupling to unfinished product chrome.
