# Postgres RLS & session variable contract

## Session keys (transaction-local)

Set at the start of each authorized Prisma transaction via `set_config(name, value, true)` (`SET LOCAL` semantics):

| Key | Type | Source | Purpose |
|-----|------|--------|---------|
| `app.tenant_id` | `text` | `AuthContext.tenantId` | Tenant isolation for all tenant-scoped tables. |
| `app.subject_id` | `text` | `AuthContext.subjectId` | Audit / future hierarchical policies (manager chain). |

**Invariant:** handlers must open data access only through [`withAuthorizedTransaction`](../../lib/security/with-authorized-transaction.ts) (or equivalent) so keys are set before any query.

## Failure modes

- Unset `app.tenant_id`: policies compare to `NULL` → **no rows visible** (fail closed).
- Never concatenate SQL with tenant identifiers; always parameterized `set_config`.

## Policy summary

- `employees`: CRUD allowed only when `employees.tenant_id = current_setting('app.tenant_id', true)`.
- `onboarding_tasks`: CRUD allowed only when the parent `employees` row matches the same tenant (join/exists).

## Operational notes

- Migrations run as the migration role; DDL is unaffected by RLS.
- Production must use a non-superuser application role. Prefer splitting `migration` vs `app` roles with identical grants except DDL.
