# Soft-delete and retention mixin

> Companion to [ADR 0004 — Modular monolith for Phase 1](../../specs/alignment/decisions/0004-modular-monolith-phase1.md).

## Why a mixin (vs. per-table custom fields)

HR data is governed by a mosaic of retention rules: GDPR/UK GDPR (purpose
limitation, employee right to erasure within statutory bounds), state US
employment recordkeeping (e.g. FLSA payroll records ≥ 3 years; payroll
calculation records ≥ 2 years; W-2 ≥ 4 years), and CBA + employer policy
overlays. Implementing retention per-table leads to inconsistent column
naming, duplicate purge code, and silent gaps when a new aggregate is
added.

The mixin standardizes two columns on every high-PII aggregate:

| Column                 | Type        | Semantics                                                                                  |
|------------------------|-------------|--------------------------------------------------------------------------------------------|
| `deleted_at`           | `TIMESTAMP` | When the row was soft-deleted by an actor (employee right-to-be-forgotten request, terminate-and-archive workflow, or admin error correction). Default reads filter rows where `deleted_at IS NOT NULL`. |
| `retention_expires_at` | `TIMESTAMP` | When the retention/legal-hold worker is allowed to **hard purge** the row. NULL means "indefinite legal hold or not yet armed for purge". |

## Tables in scope (Phase 1)

The first tranche covers the highest-PII aggregates routinely asked for in
deletion / portability requests:

- `employees` — PII root.
- `hr_case_requests` — free-text ticket bodies that may contain medical or
  performance details.
- `benefit_enrollments` — health/retirement elections (sensitive personal
  data under GDPR).
- `tax_year_documents` — annual artifact pointers tied to W-2/T4-class
  documents.

Future Feature briefs that introduce new high-PII aggregates (e.g. ATS
candidates, performance reviews) MUST extend the mixin in their own
migration and add an entry here.

## Read-side behavior

Application code reads from these tables through Prisma. Until ORM-level
soft-delete middleware ships, **callers MUST filter explicitly**:

```ts
const employee = await prisma.employee.findFirst({
  where: { id: employeeId, tenantId, deletedAt: null },
});
```

We deliberately did **not** ship Prisma middleware in this migration to
avoid silently changing every existing query in the repo. A follow-up
Feature brief will introduce an opt-in middleware once all critical paths
have been audited.

## Hard-purge worker (sketch)

```sql
-- Run inside a tenant-scoped transaction with `app.tenant_id` set.
DELETE FROM employees
WHERE deleted_at IS NOT NULL
  AND retention_expires_at IS NOT NULL
  AND retention_expires_at < now();
```

The partial indexes on `(retention_expires_at) WHERE deleted_at IS NOT
NULL` keep these sweeps fast even on large tenants. Worker logic will
live under a future `workers/retention/` directory and emit append-only
audit events via the unified [`lib/outbox/`](../../lib/outbox/) API.

## Legal hold

Legal hold is expressed by **clearing** `retention_expires_at` (set it to
`NULL`) and recording the hold in an HR case / governance audit log. The
hard-purge worker treats NULL as "do not purge", which means a legal hold
applied after soft-delete still prevents data loss.

## Compliance pointers

- US: see [`docs/compliance/`](../compliance/) for state and federal
  retention windows applied per Feature brief.
- EU/UK GDPR: data minimization is enforced separately by AI governance
  (`docs/ai-governance/`) and HITL gates; the mixin is the
  rest-of-system half of the same story.
