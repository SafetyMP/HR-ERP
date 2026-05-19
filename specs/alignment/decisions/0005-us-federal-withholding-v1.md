# ADR 0005: US federal withholding v1 (versioned wage-bracket table)

**Date:** 2026-05-18  
**Status:** Accepted (engineering v1; **counsel sign-off required** before production payroll)  
**Deciders:** Orchestrator / gap-analysis implementation  
**Tags:** payroll, compliance, payroll-calc

## Context

Mid-market buyers expect credible **federal income tax withholding** on earnings statements. The repo shipped a two-bracket **placeholder** (`US_FED_PLACEHOLDER_2026_v1` in [`lib/payroll/policy-defaults.ts`](../../../lib/payroll/policy-defaults.ts)) for deterministic kernel demos. Competitive gap analysis (2026-05-18) requires a **versioned, testable** v1 table in `packages/payroll-calc` with golden vectors—not ad hoc brackets in application code.

**Constraints:** Not legal advice; IRS Publication 15-T remains authoritative for production. Replay must key on `versionId` + `policyReleaseId`.

## Decision

1. Introduce **`US_FED_WAGE_BRACKET_2026_v1`** as a progressive bracket table in `packages/payroll-calc/src/tables/us-fed-wage-bracket-2026-v1.ts`, exported for app defaults and tests.
2. Replace default app import to use **`US_FED_WAGE_BRACKET_2026_v1`**; retain placeholder export only in tests if needed for regression.
3. Add **`us-fed-golden-vectors.test.ts`** with fixed annualized taxable wage scenarios and expected withholding minor units (±$0.01 per pay line when prorated in run-payroll).
4. Document counsel gate in [`docs/compliance/us-federal-withholding-placeholder.md`](../../../docs/compliance/us-federal-withholding-placeholder.md) pointing to this ADR and table id.

## Consequences

**Positive:** Deterministic replay; clear upgrade path to IRS-sourced tables per tax year.  
**Negative:** v1 table is **simplified** (more brackets than placeholder, still not IRS-certified).  
**Operational:** Tax year updates require new `versionId`, golden vectors, and migration note in release notes.

## Alternatives considered

1. **Embed brackets only in `run-payroll.ts`** — rejected; breaks kernel package boundaries and replay contract.
2. **Wait for full IRS 15-T parser** — rejected for spike; blocks mid-market credibility too long.
3. **External tax engine SaaS** — deferred; integration RFC when vendor selected.

## Implementation notes

- Files: `packages/payroll-calc/src/tables/*`, `lib/payroll/policy-defaults.ts`, golden tests.
- Fingerprint: existing `computePayroll` includes `federalTaxTable.versionId`.
- **Lock ordering:** N/A (no new DB tables).

## References

- Feature briefs 001, 007, 016 (paystub / pay run)
- [`docs/compliance/us-federal-withholding-placeholder.md`](../../../docs/compliance/us-federal-withholding-placeholder.md)
- Skill: `hr-payroll-calculation-engine`
