# Payroll-calc module map

| Module | Role |
|--------|------|
| [`packages/payroll-calc/src/calendar.ts`](../../../packages/payroll-calc/src/calendar.ts) | `CivilDateIso`, `DateIntervalIso` |
| [`packages/payroll-calc/src/dates.ts`](../../../packages/payroll-calc/src/dates.ts) | UTC epoch-day interval math (DST-safe civil dates) |
| [`packages/payroll-calc/src/numerics.ts`](../../../packages/payroll-calc/src/numerics.ts) | `Rational`, `CanonicalMoney`, rounding |
| [`packages/payroll-calc/src/segmentizer.ts`](../../../packages/payroll-calc/src/segmentizer.ts) | Effective-dated segments, proration |
| [`packages/payroll-calc/src/policy.ts`](../../../packages/payroll-calc/src/policy.ts) | Progressive tax + commission tiers |
| [`packages/payroll-calc/src/pipeline.ts`](../../../packages/payroll-calc/src/pipeline.ts) | Gross-to-net phases + audits |
| [`packages/payroll-calc/src/compute.ts`](../../../packages/payroll-calc/src/compute.ts) | Fingerprint + batch wrapper |
| [`packages/payroll-calc/src/canonicalJson.ts`](../../../packages/payroll-calc/src/canonicalJson.ts) | Deterministic JSON + SHA-256 |
| [`packages/payroll-calc/src/index.ts`](../../../packages/payroll-calc/src/index.ts) | Public exports |

**App import:** `@hr-erp/payroll-calc` (see root `tsconfig.json` paths + `next.config.ts` `transpilePackages`).
