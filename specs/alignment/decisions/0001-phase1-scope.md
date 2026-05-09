# ADR-0001: Phase 1 topology — single app, single Postgres

**Date:** 2026-05-09  
**Status:** Accepted  
**Phase:** Phase1_MVP

## Context

Greenfield HR ERP; need a default that matches small-team velocity while preserving **logical** bounded contexts for later extraction.

## Options considered

1. **Multi-service + Kafka + DB-per-context from day one** — clear blast-radius boundaries; high ops burden.  
2. **Single Next.js deployable + one PostgreSQL database** — simplest; enforce context boundaries in code + schema naming.  
3. **Hybrid** — single DB but separate schemas early — optional later if tenancy isolation demands.

## Decision

Adopt **option 2** for Phase1_MVP:

- One **PostgreSQL** database (Docker locally; Neon/RDS-compatible in production).  
- One **Next.js** application (App Router) owning HTTP + background hooks unless/until ADR adds workers.  
- **Logical** bounded contexts (`Core HR`, `Payroll`, etc.) — no cross-context FKs that assume separate databases yet; use clear table prefixes / schemas only if added by a later ADR.  
- **Kafka / multi-DB** deferred until ADR records a concrete trigger (scale, compliance isolation, or team topology).

## Consequences

- Faster delivery; risk of **context bleed** unless Architecture reviews schema.  
- Integrations MUST default to patterns that work **without** a central bus unless feature ADR requires one.

## Revisit when

- Second independently deployable service is staffed **or**  
- Compliance/tenant isolation requires hard DB separation **or**  
- Event volume requires Kafka/SQS (documented SLO breach).

## Links

- `AGENTS.md`, `specs/references.md`, architecture & integration templates.
