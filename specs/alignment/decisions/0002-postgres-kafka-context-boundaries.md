# ADR 0002: PostgreSQL-per-context, Kafka boundaries, hybrid REST/gRPC

**Date:** 2026-05-09  
**Status:** Accepted (target topology; Phase 1 runtime remains single-DB per [0001-phase1-scope.md](./0001-phase1-scope.md) until [0012-payroll-db-extraction.md](./0012-payroll-db-extraction.md) lands)  
**Tags:** data, messaging, scalability

## Context

The HR ERP must scale to very high interactive concurrency and enforce strict separation between Core HR and Payroll (no cross-database writes). Local and production topologies need a clear path from the current Next.js + Prisma app database toward isolated databases per bounded context.

## Decision

1. **Logical isolation:** Core HR and Payroll each own a dedicated PostgreSQL database for domain mutations. Cross-context references are **UUID keys without FK** across databases.
2. **Async integration:** Context owners publish domain facts via a **transactional `domain_outbox`** table in the **same** database as the aggregate rows; a publisher relays to **Kafka**.
3. **Schema Registry:** Confluent Schema Registry runs locally under Docker Compose profile `architecture` for Proto/Avro registration workflows (`http://localhost:8081`).
4. **Synchronous integration:** Internal services use **gRPC** (Protobuf, Buf) for high-volume reads and **REST** (OpenAPI) where appropriate; Payroll never receives credentials for Core HR’s database.

## Consequences

**Positive:** predictable blast radius, deadlock domains stay per-database, clear scaling knobs (pool per service + replica per DB).

**Negative:** more moving parts locally (Kafka + ZooKeeper + extra Postgres instances); operators must run migrations per database.

## Implementation notes

- Compose: `docker compose --profile architecture up -d`
- Core HR DSN (local): `postgresql://core_hr:core_hr_dev_password@localhost:5433/core_hr`
- Payroll DSN (local): `postgresql://payroll:payroll_dev_password@localhost:5434/payroll`
- Outbox relay: `workers/outbox-publisher/README.md`

## References

- [`docs/architecture/bounded-contexts.md`](../../../docs/architecture/bounded-contexts.md)
- [`docker-compose.yml`](../../../docker-compose.yml)
