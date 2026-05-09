---
name: hr-erp-qa-chaos
description: >-
  HR ERP QA and chaos engineering: synthetic EmployeeScenario factories,
  deterministic mega-batches, FakeClock + parallel same-instant barriers, layered
  Vitest (unit/integration) and Playwright e2e tied to scenario IDs, Postgres RLS
  session setup for integration tests, DB uniqueness under concurrency, and
  mandatory FAILURE_SUMMARY envelopes for agent handoff. Use when authoring or
  reviewing tests, reproducing flaky temporal bugs, designing chaos fixtures,
  PTO/leave duplicate submits, payroll jurisdiction edge cases, CI sharding, or
  when the user mentions QA lab, synthetic employees, temporal anomalies, or chaos testing.
---

# HR ERP QA & chaos engineering (repo skill)

## First read (this repository)

1. [docs/QA.md](../../../docs/QA.md) — commands, layout, CI seed, RLS notes  
2. [specs/templates/qa-plan.md](../../../specs/templates/qa-plan.md) — per-feature plan + `FAILURE_SUMMARY` block  
3. [CONTRIBUTING.md](../../../CONTRIBUTING.md) — synthetic-data policy + envelope requirement  

## Principles

- **Legally plausible absurdity** — combine realistic jurisdictions, leave stacks, equity/payroll windows; avoid cartoon contradictions the product trivially rejects.  
- **Deterministic chaos** — seeded RNG, injected clocks, explicit barriers; do not rely on wall-clock race luck for CI signal.  
- **Evidence-first failures** — never ship “tests failed”; always attach filled `FAILURE_SUMMARY` (template below) for the owning agent.

## Repo layout (adapt names if you fork patterns elsewhere)

| Area | Path |
| --- | --- |
| Factories + tags | [tests/fixtures/employees/](../../../tests/fixtures/employees/) |
| Generated mega-batches (gitignored) | `tests/generated/` |
| Clock + concurrency helpers | [lib/qa/](../../../lib/qa/) |
| Unit / integration / e2e | [tests/unit/domain/](../../../tests/unit/domain/), [tests/integration/workflows/](../../../tests/integration/workflows/), [tests/e2e/](../../../tests/e2e/) |
| Scenario correlation UI | [src/app/qa-lab/page.tsx](../../../src/app/qa-lab/page.tsx) |

## Mandatory workflows

### Synthetic data

- Use factories and curated JSON only; **no** real government IDs or prod dumps.  
- Large batches: `npx tsx scripts/qa-generate-fixture-batch.ts --seed=… --count=…` → `tests/generated/`.

### Temporal / concurrency

- Unit: [`FakeClock`](../../../lib/qa/clock.ts) + [`parallelDuplicateBarrier`](../../../lib/qa/parallel-same-instant.ts).  
- Integration: parallel mutations + **DB uniqueness**; with RLS, wrap writes in `SET LOCAL` / `set_config('app.tenant_id', …, true)` per transaction (see integration PTO suite).  
- E2E: share stable **`scenarioId`** via `/qa-lab?scenarioId=`.

### Failure handoff

On any automated failure, paste the filled block from [docs/QA.md](../../../docs/QA.md) (or use `npm run qa:failure-envelope` as a reminder). Route rewrite requests with **FIX_OWNER_HINT** and **NEXT_ARTIFACTS_REQUESTED**.

## Coordination with other agents

- **Orchestrator:** [.cursor/rules/orchestrator.mdc](../../rules/orchestrator.mdc) attaches **`hr-erp-qa-chaos`** + **agent-qa** on QA Tasks and test-stack Implementation Tasks (unless **QA chaos N/A** verbatim); follow step **QA chaos & layered evidence**.  
- **Compliance / legal**: jurisdiction assumptions in tests must match counsel-approved matrices — see [.cursor/skills/hr-backend-compliance/SKILL.md](../hr-backend-compliance/SKILL.md); locale ≠ employment law.  
- **Product / UAC**: [.cursor/skills/hr-product-owner/SKILL.md](../hr-product-owner/SKILL.md) — gaps in UAC are PO defects, not silent test skips.

## Optional deep reference

Tables (hazards vs reproduction), CI sharding notes, and blueprint narrative: [reference.md](reference.md).

## Portability

To reuse this workflow **outside this repo**, copy this directory to `~/.cursor/skills/hr-erp-qa-chaos/` and replace path links with your project’s equivalents.
