# Architecture governance — HR ERP

Principal systems architecture for bounded contexts, databases, APIs, and async boundaries. **Payroll (and any non-owner context) must not mutate Core HR data stores**; integration is via **Kafka events** and **explicit read APIs** only.

**Agent skills:** Load **`@hr-domain-boundaries`** ([`.cursor/skills/hr-domain-boundaries/SKILL.md`](../../.cursor/skills/hr-domain-boundaries/SKILL.md)) for bounded contexts, Kafka/outbox, and contracts. For DDL, migrations, backfills, and verification hooks, load **`@hr-data-custody`** ([`.cursor/skills/hr-data-custody/SKILL.md`](../../.cursor/skills/hr-data-custody/SKILL.md)).

**Phase 1 runtime:** Single Next.js app + one Prisma database ([ADR 0001 phase1 scope](../../specs/alignment/decisions/0001-phase1-scope.md)). Target multi-DB topology: [ADR 0002](../../specs/alignment/decisions/0002-postgres-kafka-context-boundaries.md); payroll extraction: [ADR 0012](../../specs/alignment/decisions/0012-payroll-db-extraction.md).

## Where to start

| Artifact | Purpose |
| --- | --- |
| [Module proposal template](./module-proposal-template.md) | Required package before build: context, schema, APIs, events, lock ordering |
| [ADR template](../../specs/alignment/decisions/_TEMPLATE.md) | Decision record format (live ADRs numbered in same folder) |
| [Bounded contexts](./bounded-contexts.md) | Default service map and ownership |
| [lib/ module boundaries](./lib-module-boundaries.md) | Monolith import discipline + `npm run check:lib-boundaries` |
| [lib/README.md](../../lib/README.md) | Folder map for server modules |
| [CODEBASE.md](../../CODEBASE.md) | Repo-wide code navigation (`src/`, `scripts/`, `tests/`) |
| [SLO & load gates](./slo-and-load-gates.md) | Pooling, deadlock posture, observability checklist |
| [Database migrations & state custody](./database-migrations-and-state.md) | Multi-surface migrations, expand–contract, RLS, verification & fixtures |
| [contracts/README.md](../../contracts/README.md) | Buf (gRPC), OpenAPI (REST), lint/version policy |

Related product flow: [Feature brief template](../product/feature-brief-template.md) → architecture module proposal → implementation.
