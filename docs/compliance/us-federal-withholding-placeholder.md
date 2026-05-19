# US federal withholding — versioned table (v1)

**Status:** Engineering v1 table shipped — **not** statutory advice. Counsel sign-off required before production payroll.

## Current wiring

1. **`packages/payroll-calc`** — `US_FED_WAGE_BRACKET_2026_v1` (`versionId` on withholding line codes: `federal_withholding_US_FED_WAGE_BRACKET_2026_v1`).
2. **`lib/payroll/policy-defaults.ts`** — `DEFAULT_FEDERAL_TAX_TABLE` imports the v1 table (replaces `US_FED_PLACEHOLDER_2026_v1`).
3. **`lib/payroll/run-payroll.ts`** — invokes `computePayroll` and persists `PayoutLine` rows for paystub.
4. **Golden vectors** — [`packages/payroll-calc/src/tables/us-fed-golden-vectors.test.ts`](../../packages/payroll-calc/src/tables/us-fed-golden-vectors.test.ts).
5. **ADR** — [`specs/alignment/decisions/0005-us-federal-withholding-v1.md`](../../specs/alignment/decisions/0005-us-federal-withholding-v1.md).

## Acceptance before “production-ready”

- [ ] IRS Publication 15-T (or equivalent) tables per supported pay frequency with Legal sign-off  
- [ ] Feature brief or compliance pack records counsel approval date  
- [ ] Golden vectors updated when `versionId` changes; replay fingerprint includes `policyReleaseId` + table `versionId` (already on pay run events)

**Placeholder legacy id:** `US_FED_PLACEHOLDER_2026_v1` — retired from app defaults; do not use for new runs.
