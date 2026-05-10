# UK payroll bootstrap (HMRC / PAYE / RTI)

> Status: scope draft. Country payroll #2 lives here as a reference for the Phase 2
> milestone documented in [HR ERP — Competitive Analysis & Roadmap](../../specs/competitive-analysis-roadmap.md).
> Calculation tables, code, and gold vectors land in `packages/payroll-calc/uk/`
> in the implementation Task that follows this scope. Legal counsel must sign off
> on the citations below before the engine is enabled in production.

## In-scope statutory components

| Component | Authority | Notes |
| --- | --- | --- |
| PAYE income tax | HMRC | Apply tax code (e.g. `1257L`) to taxable pay; periodic basis (W1/M1) supported. |
| National Insurance Contributions | HMRC | Class 1 employee + employer; category letters `A` default, plus `M`, `H`, `V`, `J`, `Z` etc. |
| Statutory Sick Pay (SSP) | HMRC | Pay-period-based accumulator; daily rate by year. |
| Statutory Maternity / Paternity Pay (SMP / SPP) | HMRC | Linked to qualifying earnings + average weekly earnings. |
| Workplace pension auto-enrolment | TPR | Qualifying earnings band; employer + employee minimums. |
| Student / postgraduate loan deductions | HMRC / SLC | Plan 1, 2, 4, 5, postgraduate; thresholds / rates per tax year. |
| Apprenticeship Levy | HMRC | Employer-only; only relevant for employers above the annual allowance. |

## Filings

* **RTI: Full Payment Submission (FPS).** Sent on or before each pay date.
* **RTI: Employer Payment Summary (EPS).** Used for adjustments (recoveries,
  apprenticeship levy, no-payment notifications).
* **P60.** Year-end summary per employee — generated from finalised pay-run
  totals; persists in [`tax_year_documents`](../../prisma/schema.prisma).
* **P45.** On termination — initiated by the offboarding workflow (see
  [`workflow_definitions`](../../prisma/schema.prisma) `OFFBOARDING` kind).
* **P11D / P11D(b).** Benefits-in-kind — out of scope for the country #2 cut;
  tracked as a Phase 3 task.

## Calculation kernel layout (target)

```
packages/payroll-calc/
  src/
    countries/
      uk/
        paye.ts           // tax-code parsing + cumulative + non-cumulative basis
        ni.ts             // category letters, primary/secondary thresholds, UEL/UST
        ssp.ts            // qualifying days, waiting days, daily rate
        student-loan.ts   // plan 1/2/4/5 + PG
        pension.ts        // qualifying earnings band auto-enrolment
        rti.ts            // FPS / EPS row builders
      __tests__/
        uk-golden-vectors.test.ts  // HMRC published vectors per tax year
```

## Year-end form generation

The application generates a **P60** by reading finalised `PayrollPeriod` rows
plus `PaymentInstruction` / `PayoutLine` totals scoped to the UK tax year
(6 April → 5 April). The output is rendered to a content-addressed object in
the existing `TaxYearDocument` table, then surfaced in the employee
self-service tax documents tab. Audit trail: a `compliance.year_end.uk_p60`
event is enqueued via [`enqueueEvent`](../../lib/outbox/enqueue-event.ts).

## Open questions for Legal

1. Do we support agency-worker / IR35 deemed employment in scope #1, or defer?
2. Pension scheme registry — single-scheme MVP, or carrier-agnostic from day one?
3. Northern Ireland: confirm CT-specific deviations are nil for PAYE/NIC purposes
   in this release.

## Acceptance criteria for the implementation Task

- [ ] HMRC published gold vectors for tax year **2026/27** parse through the
      kernel within ±£0.01 per pay-line.
- [ ] FPS XML round-trips against HMRC test gateway for at least three sample
      payslips (single hire, mid-period rate change, termination).
- [ ] P60 PDF generation deterministic across reissue; SHA-256 of bytes is
      stored on `TaxYearDocument`.
- [ ] Tax-code edge cases (`BR`, `D0`, `D1`, `NT`, `K-prefix`, suffixes
      `L`/`M`/`N`/`T`/`X`) covered by unit tests.
- [ ] Pension auto-enrolment recalculates when an employee crosses the qualifying
      earnings threshold mid-period; emits a `benefits.pension.auto_enrolled` event.
