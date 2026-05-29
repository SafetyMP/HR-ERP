# ADR 0012: Payroll database extraction (Phase 2 topology)

**Date:** 2026-05-28  
**Status:** Accepted (incremental rollout)  
**Supersedes in part:** Runtime assumptions in [0001-phase1-scope.md](./0001-phase1-scope.md) for payroll persistence only.

## Context

Phase 1 uses a single Prisma database. Payroll calculation is already isolated in `packages/payroll-calc`. Bounded-context docs require Payroll to own `payroll` Postgres and never mutate Core HR data stores.

## Decision

1. Introduce a dedicated **Payroll** SQL surface under `services/payroll/db/migrations/` (forward-only).
2. Application code accesses payroll tables through **ports** in `lib/payroll/ports/` (`PayrollDb`, `CoreHrEmployeeRead`).
3. Core HR employee facts reach Payroll via **domain_outbox → Kafka** (`workers/outbox-publisher/`), not cross-database FKs.
4. Monolith Prisma remains for Core HR and shared app models until Core HR extraction (ADR 0013).

## Consequences

**Positive:** Aligns runtime with [0002-postgres-kafka-context-boundaries.md](./0002-postgres-kafka-context-boundaries.md); protects pay run blast radius.

**Negative:** Dual-write period during expand-migrate-contract; operators run migrations on two surfaces.

## Rollback

Disable Payroll port wiring via `PAYROLL_DB_MODE=monolith` (default) to keep reads/writes on app Prisma until cutover is verified.

## Links

- [bounded-contexts.md](../../docs/architecture/bounded-contexts.md)
- `lib/payroll/ports/`
