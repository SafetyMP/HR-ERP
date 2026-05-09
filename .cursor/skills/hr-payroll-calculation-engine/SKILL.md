---
name: hr-payroll-calculation-engine
description: >-
  Guides payroll and compensation math in this repo: minor-unit money, rational
  rates, mid-cycle proration via segmentizer, phased gross-to-net pipeline,
  versioned withholding/commission tables, deterministic SHA-256 input
  fingerprints, and parallel-safe batch APIs. Use when implementing or
  reviewing payroll, time-to-pay, gross-to-net, proration, raises mid-period,
  pre-tax deductions, statutory brackets, staggered commissions, rounding
  policies, idempotent pay runs, or code under packages/payroll-calc.
---

# HR ERP payroll & compensation calculation engine (repo skill)

## Workspace grounding

Before citing paths, scripts, APIs, or dependencies for **this repo**, apply [workspace grounding](../README.md) against the active checkout—use Read/Grep (or search), not training-data defaults.

## Source of truth

The **pure calculation kernel** lives in [`packages/payroll-calc`](../../../packages/payroll-calc). Orchestration (Prisma, APIs, queues) must **map DB rows → `GrossToNetPipelineInput` DTOs** and persist `inputsFingerprintSha256`, `calcSemanticVersion`, and outputs for replay—do not embed payroll math in route handlers.

## Numerics (non-negotiable)

- **Money:** `CanonicalMoney` = ISO currency + scale + **`bigint` minor units** (e.g. cents). No silent `number` / `float64` for monetary totals.
- **Rates / brackets / splits:** [`Rational`](../../../packages/payroll-calc/src/numerics.ts) or integer numerator/denominator pairs; **one explicit `RoundingMode` per snap** (`half_up`, `half_even`, `down`, `up`).
- **Analytic only:** `float64` allowed for non-money quantities (e.g. display), never for accumulated tax or net pay.

## Temporal / proration

- Model pay periods as **contiguous segments** from merged effective-dated breakpoints ([`segmentizePayPeriod`](../../../packages/payroll-calc/src/segmentizer.ts)).
- Strategies: **`calendar_days`** or **`work_hours`** (keys `${start}|${end}`)—do not mix strategies inside one run without caller policy.
- Optional **[`applyResidualToSegments`](../../../packages/payroll-calc/src/segmentizer.ts)** to tie rounded line cents to finance-posted totals.

## Gross-to-net pipeline

Phased, ordered, immutable transforms ([`runGrossToNetPipeline`](../../../packages/payroll-calc/src/pipeline.ts)):

1. Gross composition (base + tiered commission when configured)
2. Pre-tax deductions (separate flags for **federal taxable wages** vs **net**)
3. Taxable income (e.g. standard deduction minor) — extend per jurisdiction
4. Statutory withholding (progressive tables in minor units)
5. Post-tax / garnishments / employer liabilities — **extend here** when product requires; keep phases explicit

Honor **phase audits**: line sums vs phase totals where implemented.

## Policy / tables

- Version every table: [`ProgressiveTaxTable`](../../../packages/payroll-calc/src/policy.ts), [`CommissionTierTable`](../../../packages/payroll-calc/src/policy.ts); carry [`PayrollPolicyRelease`](../../../packages/payroll-calc/src/policy.ts) ids on inputs and stored results.
- US-style **marginal slice** helpers: [`progressiveIncomeTaxMinor`](../../../packages/payroll-calc/src/policy.ts), [`tieredCommissionMinor`](../../../packages/payroll-calc/src/policy.ts). Replace or extend for multi-country schedules—**never** hardcode one jurisdiction in shared types without a version id.

## Statelessness, idempotency, parallelism

- Entry points: [`computePayroll`](../../../packages/payroll-calc/src/compute.ts), [`computePayrollBatchParallel`](../../../packages/payroll-calc/src/compute.ts) (`map` only—no shared mutable caches).
- Same canonical input snapshot + same semantic version ⇒ same **fingerprint** ([`stableStringify`](../../../packages/payroll-calc/src/canonicalJson.ts) + SHA-256).

## Verification

- Run package tests: `cd packages/payroll-calc && npx vitest run` (or `npm run test:payroll` from repo root when workspaces install cleanly).
- Add **golden vectors** when changing brackets, proration, or rounding (see [`payroll-calc.test.ts`](../../../packages/payroll-calc/src/payroll-calc.test.ts)).

## Orchestration (repo default)

The always-on rule [`.cursor/rules/orchestrator.mdc`](../../rules/orchestrator.mdc) schedules **`hr-payroll-calculation-engine`** for non-trivial features that touch pay math; delegated **Cursor Task** prompts should attach this skill (and **`hr-backend-compliance`**) for Implementation/QA on those paths unless an explicit **N/A** is recorded.

## Coordination

- **Compliance / wage-hour matrix:** [.cursor/skills/hr-backend-compliance/SKILL.md](../hr-backend-compliance/SKILL.md) (rules of record vs this **math kernel**).

## Optional module index

For a file-by-file map and extension points, see [reference.md](reference.md).
