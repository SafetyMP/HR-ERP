# Multi-country payroll expansion roadmap (Phase 3)

> Builds on [`docs/compliance/uk-payroll-bootstrap.md`](uk-payroll-bootstrap.md)
> (country #2). Phase 3 extends the kernel to the next set of jurisdictions
> while keeping `packages/payroll-calc/` deterministic, fingerprint-replayable,
> and policy-versioned.

## Country tier model

We rank countries by complexity → blast radius so the team can sequence work
without surprises.

| Tier | Examples | Drivers | Tooling implication |
| --- | --- | --- | --- |
| 1 | US, UK | Many statutory components, frequent rule changes, strict filings (RTI, FPS, IRS). | First in `packages/payroll-calc/` with golden vectors per tax year. |
| 2 | Canada, Ireland, Australia | Federal + provincial/state mix, RTI-style filings. | Reuse country #1 filing harness with localized matrices. |
| 3 | Germany, France, Netherlands | Strong works-council + collective bargaining; multilingual paystubs. | Add CBA precedence into the existing matrix; add localization. |
| 4 | India, Brazil, Mexico | High volume of statutory deductions (PF, ESI, INSS, FGTS, IMSS). | Wage-band tables become the dominant complexity; expand fixture library. |
| 5 | Japan, Singapore, UAE | Year-end true-ups (Nencho, IR8A), Ramadan adjustments. | Calendar engine work + multilingual statements. |

## Generic kernel deliverables

For each new country, the kernel must add:

1. **Tax tables** versioned by effective date in
   [`packages/payroll-calc/policy/`](../../packages/payroll-calc/policy/) with
   citation references in YAML.
2. **Statutory deduction primitives** (income tax, social insurance, pension)
   with executable test vectors.
3. **Year-end form generation** + a corresponding `tax_year_documents` row.
4. **Filing harness** — XML / EDI / portal-specific formatter and round-trip
   test against an authority test gateway (where available).
5. **Holiday calendar + payday rule** — public holiday + EOM/EOM-1 rule
   handling. The calendar engine remains common across countries.
6. **Currency floor** — minor-unit exponent overrides for currencies where
   ISO 4217 doesn't match local convention (e.g. JPY = 0 minor units, KWD = 3).

## Operational guardrails

* No country goes live without **two consecutive** clean reconciliations
  between the kernel and a parallel-run vendor (or in-house spreadsheet
  authored by counsel).
* Add a `compliance.country.<iso2>.enabled = false` feature flag to keep
  rollouts deterministic.
* Every new tax table is shipped as an immutable `policy_release_id` referenced
  by every `PaymentInstruction` it computed.

## Engineering acceptance per country

- [ ] Jurisdiction matrix entry merged in
      [`docs/compliance/jurisdiction-matrix-pay-premiums.yaml`](jurisdiction-matrix-pay-premiums.yaml)
      with a Legal-signed citation reference.
- [ ] Kernel test vectors green for the most recent two tax years.
- [ ] Year-end form deterministic across reissue (sha-256 of bytes recorded).
- [ ] Filing dry-run validated against the authority test gateway.
- [ ] Localization (paystub strings, currency symbol, RTL where applicable)
      verified in a Playwright snapshot.
- [ ] Performance baseline: 1000-employee batch ≤ 2s in `computePayrollBatchParallel`.
