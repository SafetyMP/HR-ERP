# July 2026 US state compliance calendar (teaching reference)

**Status:** Counsel-gated checklist  
**Audience:** Product, recruiting, payroll ops, agents  
**Last reviewed:** 2026-07-18  

> **Not legal advice.** Summaries below are secondary-source snapshots for an evergreen OSS reference app. **Counsel must confirm** before any production jurisdiction goes live. This repo is **not** a certified multi-state employer compliance engine — see [evergreen-open-source-positioning.md](../meta/evergreen-open-source-positioning.md).

## Secondary sources (July 2026)

- [ADP — July 2026 Employer Compliance Calendar](https://www.adp.com/spark/articles/2026/07/july-2026-employer-compliance-calendar-key-hr-payroll-benefits-and-workforce-management-deadlines.aspx)
- [EisnerAmper — Summer compliance changes (multi-state)](https://www.eisneramper.com/insights/employee-benefit-plan/summer-compliance-changes-0726/)
- [Paylocity — 2026 HCM mid-year review](https://www.paylocity.com/resources/tax-compliance/alerts/2026-hcm-mid-year-review/)

Effective dates and thresholds change; re-check primary statutes before go-live.

## Theme → product mapping

| Theme | Approx. effective | Teaching surface in HR ERP | Explicit deferral |
|-------|-------------------|----------------------------|-------------------|
| **Pay transparency** (VA all employers; ME ≥10 employees) | VA 2026-07-01; ME 2026-07-29 | Optional pay range on `JobRequisition` + manager UI ([brief 029](../product/feature-briefs/029-pay-transparency-posting-fields.md)) | Automated jurisdiction engine; penalty math; public career site |
| **Salary-history ban** (VA) | 2026-07-01 | Application create path must **not** collect prior pay; documented in brief 029 | Offer negotiation engines; third-party screening forms |
| **Fair Chance** (WA expansions) | Statewide timing mid/late July 2026 (size-phased) | Pipeline copy: criminal-history inquiry deferred until **conditional offer** | Background-check vendors; individualized-assessment adjudication |
| **Minimum wage** (AK, DC, OR + many localities) | 2026-07-01 | Data-owned tables; v1 matrix has locality extension points only ([v1-scope.md](./v1-scope.md)) | Encoding July 2026 rate tables into `payroll-calc` |
| **Leave / PFML / family leave** (e.g. HI, NJ, IL noise) | Various July 2026 | Existing leave self-service teaching surfaces | State PFML contribution engines |
| Warehouse production quotas (CT), drug-testing (ME), WARN-style (NE), etc. | July 2026 | — | **Out of scope** for this reference app |

## Pay transparency (detail)

**Virginia (2026-07-01):** Disclose good-faith wage/salary range on public and internal postings for hire, promotion, transfer, or other employment opportunities; prohibit seeking/relying on applicant salary history (with limited “voluntarily disclosed” nuance — counsel confirms).

**Maine (2026-07-29):** Employers with 10+ employees include pay range in job postings (commission-only exception); provide current-position range on employee request; retain job title / pay history records for employment duration (recordkeeping — counsel confirms).

**Product pattern:** Store optional `payRangeMin` / `payRangeMax` / `payRangeCurrency` and optional `postingJurisdiction` on requisitions; surface ranges when status is OPEN. Do not claim statutory completeness.

## Salary history

Application create (`POST /api/v1/recruiting/applications`) accepts candidate identity + requisition linkage only — **no prior-pay fields**. Do not add salary-history collection without a new counsel-gated brief.

## Fair Chance (pattern only)

Brief [014](../product/feature-briefs/014-hiring-manager-recruiting-pipeline.md) keeps background checks out of scope. Teaching UI may remind managers that criminal-history inquiries are deferred until a **conditional offer**. No vendor integration, no adjudication workflow.

## Minimum wage / overtime

July 2026 rate changes are **not** encoded here. Premium math stays on the [jurisdiction matrix](./jurisdiction-matrix-pay-premiums.yaml) + counsel sign-off in [v1-scope.md](./v1-scope.md). Locality overrides remain extension points (`locality_id`).

## Sign-off placeholder

| Role | Name | Date | Notes |
|------|------|------|-------|
| Employment counsel | _TBD_ | | Confirm VA/ME/WA applicability for any fork go-live |
| Product Owner | _TBD_ | | Brief 029 UAC acceptance |

## Related

- [Feature brief 029 — pay transparency posting fields](../product/feature-briefs/029-pay-transparency-posting-fields.md)
- [Feature brief 014 — recruiting pipeline](../product/feature-briefs/014-hiring-manager-recruiting-pipeline.md)
- [v1-scope.md](./v1-scope.md)
