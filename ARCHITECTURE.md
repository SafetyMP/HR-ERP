# Architecture

HR ERP runs today as a **modular monolith**: a single Next.js (App Router) application backed by **one PostgreSQL database** (Prisma), with multi-tenant isolation enforced by JWT to ABAC policy checks to Postgres row-level security. Bounded contexts (Core HR, Payroll, Benefits, and others) are separated by import discipline in `lib/`, with a documented path toward per-context Postgres and Kafka-based integration. The non-negotiable rule across all phases: **Payroll and other non-owning contexts never mutate Core HR data stores** — integration happens through events and explicit read APIs only.

This file is a map, not a duplicate. For depth, start here:

- [docs/architecture/README.md](docs/architecture/README.md) — architecture governance, where to start, ADR index
- [docs/architecture/bounded-contexts.md](docs/architecture/bounded-contexts.md) — service map and ownership
- [docs/architecture/lib-module-boundaries.md](docs/architecture/lib-module-boundaries.md) — monolith import discipline (`npm run check:lib-boundaries`)
- [docs/architecture/database-migrations-and-state.md](docs/architecture/database-migrations-and-state.md) — migrations, expand/contract, RLS
- [docs/meta/evergreen-open-source-positioning.md](docs/meta/evergreen-open-source-positioning.md) — what this reference is and is not
- [CODEBASE.md](CODEBASE.md) — repo-wide code navigation

Current runtime scope is defined in [ADR 0001](specs/alignment/decisions/0001-phase1-scope.md); the target multi-database topology lives in [ADR 0002](specs/alignment/decisions/0002-postgres-kafka-context-boundaries.md) and payroll extraction in [ADR 0012](specs/alignment/decisions/0012-payroll-db-extraction.md).
