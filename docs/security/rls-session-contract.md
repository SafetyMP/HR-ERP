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

## Background workers (dual role)

Cross-tenant **drain** polls (claim / list / retention scan) must not use the app Prisma client under `FORCE ROW LEVEL SECURITY` + `NOBYPASSRLS`.

| Role | DSN | Use |
|------|-----|-----|
| **App** | `DATABASE_URL` | HTTP handlers via `withAuthorizedTransaction`; per-tenant job work via [`withTenantTransaction`](../../lib/security/with-tenant-transaction.ts) |
| **Drain** | `WORKER_DRAIN_DATABASE_URL` (fallback `OUTBOX_DATABASE_URL`) | Cross-tenant claim/list: integration outbox publish, webhook delivery drain, token-refresh scan, DLQ read-by-id, retention tenant discovery |
| **Kafka outbox** | `OUTBOX_DATABASE_URL` | [`workers/outbox-publisher`](../../workers/outbox-publisher/index.ts) raw `pg` + `FOR UPDATE SKIP LOCKED` on `domain_outbox` |

Helper: [`lib/security/drain-db.ts`](../../lib/security/drain-db.ts) (`getDrainPrisma`, `assertDrainUrlDistinctFromApp`).

**Invariants**

- Drain clients may see all tenants; prefer claim → enqueue with `tenantId` → tenant-scoped processor.
- Retention purge: drain lists distinct `tenantId`s, then deletes inside `withTenantTransaction` on the app client.
- DLQ writes with a known tenant use `withTenantTransaction`; untenanted edge cases use drain.
- In production, drain DSN must differ from `DATABASE_URL` unless `ALLOW_DRAIN_SAME_AS_APP=1` (local superuser only).
- Compose default `POSTGRES_USER` is often a superuser and **masks** RLS — do not treat local success as proof of dual-role correctness.

## Operational notes

- Migrations run as the migration role; DDL is unaffected by RLS.
- Production must use a non-superuser application role. Prefer splitting `migration` vs `app` roles with identical grants except DDL.
