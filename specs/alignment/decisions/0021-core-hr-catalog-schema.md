# ADR 0021: Core HR catalog schema (Department / JobRole)

**Date:** 2026-07-19  
**Status:** Accepted  
**Deciders:** Human Lead, Architecture, DB Migration  
**Tags:** architecture, data, core-hr, catalog  
**Bounded context:** Core HR

## Context

`Department` and `JobRole` are the Core HR catalog aggregates used for org assignment, predictive demos, and later org-chart surfaces. Today `Department.code` is optional, department names and job-role titles are not unique per tenant, and departments have no parent link for a simple catalog tree. Callers cannot reliably upsert by natural keys, and soft-archive (ACTIVE / INACTIVE) is not modeled on these rows.

Position hierarchy (`Position.parentPositionId`) remains the reporting-line model; this ADR does **not** redefine positions or add API routes.

## Decision

Evolve the Core HR catalog schema as follows (forward-only migration; no API routes in this packet):

1. **`CatalogStatus` enum** — `ACTIVE` | `INACTIVE`, default `ACTIVE`, on both `Department` and `JobRole`.
2. **`Department.parentId`** — optional self-FK (`ON DELETE SET NULL`) for a department tree within a tenant.
3. **`Department.code`** — required (`NOT NULL`). Keep `@@unique([tenantId, code])`. Backfill null/blank codes to deterministic per-row values before the constraint.
4. **Natural-key uniqueness** — `@@unique([tenantId, name])` on `Department`; `@@unique([tenantId, title])` on `JobRole`. Deduplicate colliding names/titles within a tenant before adding unique indexes (append a stable suffix to duplicates; keep the earliest row’s original value).
5. **No API routes** in this change set — schema + migration + seed/demo script alignment only.
6. **No payroll DB changes** and **no Position hierarchy changes**.

## Consequences

**Positive:**

- Catalog rows support archive without delete.
- Upserts and idempotent seeds can key on `(tenantId, code)`, `(tenantId, name)`, or `(tenantId, title)`.
- Department tree is expressible without conflating with Position reporting lines.

**Negative / trade-offs:**

- Existing tenants with duplicate names/titles or null codes require a one-time backfill/dedupe migration.
- Renaming a department or job role title becomes a uniqueness-sensitive write.

**Operational:**

- Apply with forward-only `prisma migrate`; verify with `npx prisma validate` / generate and existing `db:verify` checks for orphan FKs.
- Demo seeds that create departments/job roles must prefer upsert on the new unique keys.

## Alternatives considered

1. **Reuse `EmployeeStatus` / `PositionStatus`** — rejected; catalog lifecycle is only ACTIVE|INACTIVE and must not couple to employment or headcount enums.
2. **Defer uniqueness until APIs land** — rejected; seeds and integrations already collide without natural keys.
3. **Model department tree only via Position** — rejected for catalog browsing; Position remains plan-vs-actual reporting, not the catalog taxonomy.

## Implementation notes

- Migration: add columns with defaults → backfill codes → dedupe names/titles (and codes if needed) → `NOT NULL` on code → FK + unique indexes.
- Lock ordering: catalog tables only; no cross-context payroll writes.
- Out of scope: REST/GraphQL catalog APIs, Position changes, payroll schema.

## References

- Phase scope: [0001-phase1-scope.md](0001-phase1-scope.md)
- Boundaries: [docs/architecture/bounded-contexts.md](../../../docs/architecture/bounded-contexts.md)
- Migrations: [docs/architecture/database-migrations-and-state.md](../../../docs/architecture/database-migrations-and-state.md)
