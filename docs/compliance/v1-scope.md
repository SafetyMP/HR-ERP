# Compliance v1 scope declaration

This document satisfies the **feature / jurisdiction / worker-type / sensitive-data** gate for the reference backend capability tied to [Feature brief 001](/docs/product/feature-briefs/001-employee-paystub-self-service.md).

## Reference feature (backend)

**Capability ID:** `pay-premiums-and-allocations-v1`

**Business description:** Compute and persist **regular, overtime, and double-time (where applicable) premium hours and dollars** for **W-2 employees** such that a **current paystub** can display earnings lines that are **mathematically consistent**, **jurisdictionally defensible**, and **auditable**. This includes allocation of hours across **multiple work locations** within a pay period when labor rules differ by situs.

**Out of scope for v1 (explicit):**

- Contractor payment logic (1099-NEC), full global payroll for non-US entities
- Specific **income tax** withholding engines or W-2 generation (tax touches only where required for gross-to-net display are excluded here)
- **HIPAA-covered PHI** in benefits claims or clinical integrations
- Paper check / direct deposit **disbursement** orchestration
- **Predictive scheduling** premium accrual (matrix reserves hooks; no mandatory calculation in v1)

## Jurisdictions in scope (v1)

| Layer | Code | Notes |
|-------|------|-------|
| Federal (US) | `US-FED` | FLSA baseline; **do not assume** 40h as universal workweek—use configured **FLSA workweek** per employer + worker assignment |
| State — California | `US-CA` | Daily OT/DT, seventh-day rules, industry orders (see matrix `variant` fields) |
| State — New York | `US-NY` | Weekly OT baseline; **hospitality** and other wage orders as variants |
| State — Colorado | `US-CO` | Overtime and COMPS Order applicability by classification |
| State — Texas | `US-TX` | FLSA-aligning floor unless CBA; included as **single-rule** contrast state |

**Locality:** No specific city ordinance encoded in v1 YAML; `locality_id: null` with **extension points** for fair workweek / min-wage locality overrides in later releases.

## Worker types in scope (v1)

| Type | In v1 | Notes |
|------|-------|-------|
| W-2 employee, non-exempt | Yes | Primary |
| W-2 employee, exempt | Yes | **No OT under this engine** unless reclassification flag or state white-collar exception path (emit `COMPLIANCE_EXEMPT_NO_OT`) |
| Union / CBA | Yes | **CBA overrides** statutory floor when `union_agreement_id` present and matrix row marks `precedence: cba` |
| Fixed-term W-2 | Yes | Same rules; tenure affects **waiting periods** elsewhere, not premium math in v1 |
| Part-time / seasonal W-2 | Yes | **No assumption** of 40h eligibility for benefits; premium rules follow hours worked |
| 1099 / independent contractor | **No** | Reject with `COMPLIANCE_WORKER_TYPE_NOT_SUPPORTED` if this engine invoked |
| International assignee (non-US payroll) | **No** | Out of scope for v1 matrix |

## Age-driven rules (v1)

- **Minors:** Engine must **accept** `worker.age_years` and `jurisdiction.minor_hour_limits_profile_id`. If profile applies, **cap daily/weekly hours** before premium calculation and emit `COMPLIANCE_MINOR_HOUR_CAP_APPLIED` in audit. Exact caps are **data-driven** per state child-labor tables (Legal data owner)—v1 ships **schema + rejection** if data missing when minor flag set.
- **No** automated retirement-age provisions in v1.

## PHI, biometric, and sensitive categories

| Category | Applies in v1? |
|----------|----------------|
| HIPAA PHI (benefits / TPA clinical) | **No** for this capability |
| Biometric identifiers (BIPA etc.) | **No** |
| Payroll finance PII (SSN, bank) | **Not computed here**; access control per [RLS session contract](/docs/security/rls-session-contract.md) |

## Sign-off placeholder

| Role | Name | Date | Version |
|------|------|------|---------|
| Employment counsel | _TBD_ | | 0.1 |
| Payroll operations | _TBD_ | | 0.1 |
