# ADR 0007: UK payroll bootstrap (PAYE / NI spike)

**Date:** 2026-05-18  
**Status:** Accepted (engineering spike; **HMRC / counsel sign-off** before production)  
**Deciders:** Orchestrator / gap-analysis implementation  
**Tags:** payroll, compliance, uk

## Context

Mid-market roadmap targets **US + UK**. [`docs/compliance/uk-payroll-bootstrap.md`](../../../docs/compliance/uk-payroll-bootstrap.md) defines PAYE, Class 1 NIC, and golden-vector layout under `packages/payroll-calc/src/countries/uk/`. US federal v1 table landed in ADR 0005; UK needs a **parallel, versioned** bootstrap without building full RTI/FPS in this spike.

## Decision

1. Scaffold **`packages/payroll-calc/src/countries/uk/`** with:
   - `paye.ts` — tax-code parsing stub + cumulative PAYE on taxable pay (minor units, GBP scale 2)
   - `ni.ts` — Class 1 employee/employer NIC on earnings band (simplified 2026/27 thresholds)
   - `types.ts` — shared UK payroll types and `versionId` constants
2. Add **`uk-golden-vectors.test.ts`** with HMRC-style sample scenarios (documented expected values; spike uses engineering rounding).
3. **Wire UK in `runPayroll`** when `organization.jurisdictionCountry` is GB/UK (implemented 2026-05-18 via `resolvePayrollJurisdiction` — still **not** RTI/filing-ready).
4. Document open Legal questions in uk-payroll-bootstrap.md (unchanged).

## Consequences

**Positive:** Clear package boundary for country #2; test harness ready for counsel-approved vectors.  
**Negative:** Simplified bands—not filing-ready.  
**Operational:** New tax year = new `versionId` + vector file.

## Alternatives considered

1. **Single global pipeline** — rejected; violates payroll-calc jurisdiction versioning pattern.
2. **Defer all UK code** — rejected; mid-market geo requirement.

## Implementation notes

- Export types/functions from `packages/payroll-calc` index when stable.
- P60/FPS/RTI remain out of spike scope per uk-payroll-bootstrap.md.

## References

- [`docs/compliance/uk-payroll-bootstrap.md`](../../../docs/compliance/uk-payroll-bootstrap.md)
- ADR 0005 (US federal parallel)
