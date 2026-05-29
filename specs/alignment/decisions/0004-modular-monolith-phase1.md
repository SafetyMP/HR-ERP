# ADR 0004: Modular monolith for Phase 1; deferred per-context Postgres split

**Date:** 2026-05-09
**Status:** Accepted (supersedes the operational guidance in [`0002-postgres-kafka-context-boundaries.md`](0002-postgres-kafka-context-boundaries.md) for Phase 1)
**Tags:** data, messaging, scalability, deployment

## Context

ADR 0001 specifies PostgreSQL-per-context plus a Kafka transactional outbox between
Core HR and Payroll. The repository ships scaffolds for that topology
(`services/core-hr/db/migrations/V001__domain_outbox.sql`,
`services/payroll/db/migrations/V001__domain_outbox.sql`,
`workers/outbox-publisher/`) and a Compose `architecture` profile.

The runtime, however, today is a **single Next.js application backed by a single
Postgres** referenced as `DATABASE_URL`. Every Prisma model — including
`payment_instruction`, `payout_lines`, and `payroll_periods` — lives in the same
schema as `employees`, `pto_balances`, etc. Operating as if data is split when it
is not creates two failure modes:

1. **False isolation.** Engineers reason about Payroll as if it cannot block Core
   HR pages, but a slow report query on the same database can. RLS protects rows,
   not throughput.
2. **Premature topology cost.** The Compose `architecture` profile spins up two
   extra Postgres servers, ZooKeeper, Kafka, and the Schema Registry. None of
   them are exercised by the current app code path. Operators inheriting the
   project rationally assume the system already runs that way.

## Decision

**Phase 1 is a modular monolith.** Bounded contexts remain logical (folders +
packages), and run on a single Postgres database. ADR 0001 stands as the
**Phase 2 target**; the Compose `architecture` profile is reserved for that
work.

Specifically, for Phase 1:

1. **One Postgres.** All Prisma models live in one schema. RLS continues to
   enforce tenant isolation. There is no per-context database in this phase.
2. **Outbox.** The `IntegrationOutbox` table (BullMQ backed, vendor calls) and
   the `domain_outbox` SQL pattern (Core HR / Payroll cross-context) are unified
   behind a single `lib/outbox/` API (`enqueueEvent`). Backends remain
   pluggable; the default backend writes to `IntegrationOutbox`.
3. **Kafka is optional.** If `KAFKA_BROKERS` is set, the unified outbox flushes
   to Kafka via `workers/outbox-publisher/`. If not, BullMQ workers process
   integration jobs and Core HR / Payroll cross-context events stay in-process
   (`lib/outbox/inproc-bus.ts`) until split.
4. **Phase 2 split is pre-staged.** A future migration moves Payroll tables to
   their own Postgres database — without changing the public REST/gRPC contracts
   — using the same `lib/outbox/` API and the same Kafka topic schema. ADR 0001
   describes that target.
5. **Documentation honesty.** The README and `docs/architecture/README.md`
   reflect the Phase 1 reality. The `architecture` Compose profile carries an
   explicit "experimental / Phase 2 preview" header so operators are not misled.

## Consequences

**Positive.**
- Reduced operational footprint for development and small deployments.
- One source of truth for migrations during the period when domain models are
  still moving fast.
- A single outbox API ensures the Phase 2 split lands without breaking calling
  code.

**Negative.**
- Cross-context concurrency contention remains possible; mitigations live in
  per-route Postgres connection pool tuning and read-replica routing for
  reports.
- Operators who previously ran the `architecture` profile against the live app
  will need to migrate to the simpler `db:up` profile.

## Implementation notes

- New unified outbox API: `lib/outbox/enqueue-event.ts`.
- The default backend continues to use `IntegrationOutbox`; the `domain_outbox`
  tables under `services/{core-hr,payroll}/db/migrations/` are retained as
  Phase 2 fixtures and are not migrated against `DATABASE_URL`.
- Soft-delete + retention is now a Prisma model mixin (`deleted_at`,
  `retention_expires_at`) applied to high-PII aggregates as part of Feature
  briefs that touch them. See `docs/architecture/soft-delete-and-retention.md`.

## References

- [`0002-postgres-kafka-context-boundaries.md`](0002-postgres-kafka-context-boundaries.md)
- [`docs/architecture/README.md`](../../../docs/architecture/README.md)
- [`docs/architecture/database-migrations-and-state.md`](../../../docs/architecture/database-migrations-and-state.md)
