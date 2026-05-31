# Payroll calculation kernel (L3)

Canonical: [packages/payroll-calc/](../../../packages/payroll-calc/)

## Source of truth

Pure calculation kernel in `packages/payroll-calc`. Orchestration maps DB rows → `GrossToNetPipelineInput` DTOs; persist `inputsFingerprintSha256`, `calcSemanticVersion`, outputs for replay — no payroll math in route handlers.

## Numerics (non-negotiable)

- **Money:** `CanonicalMoney` = ISO currency + scale + **`bigint` minor units**. No silent `float64` for monetary totals.
- **Rates/brackets:** `Rational` or integer pairs; one explicit `RoundingMode` per snap.
- **Analytic only:** `float64` for non-money quantities, never accumulated tax or net pay.

## Temporal / proration

- Pay periods as contiguous segments from effective-dated breakpoints (`segmentizePayPeriod`).
- Strategies: `calendar_days` or `work_hours` — do not mix inside one run without caller policy.
- Optional `applyResidualToSegments` to tie rounded line cents to finance-posted totals.

## Gross-to-net pipeline

Phased transforms (`runGrossToNetPipeline`):

1. Gross composition (base + tiered commission)
2. Pre-tax deductions
3. Taxable income
4. Statutory withholding
5. Post-tax / garnishments / employer liabilities

## Policy / idempotency

- Version every table; carry `PayrollPolicyRelease` ids on inputs and stored results.
- Entry points: `computePayroll`, `computePayrollBatchParallel` (no shared mutable caches).
- Same canonical input + semantic version ⇒ same fingerprint (SHA-256).

## Verification

- `npm run test:payroll` from repo root.
- Add golden vectors when changing brackets, proration, or rounding.

## Coordination

- Minor-unit money, rational rates, mid-cycle proration
- Deterministic SHA-256 input fingerprints, replay fields
- Versioned withholding/commission tables
- Pair with compliance L3 for wage-hour rules vs math kernel
