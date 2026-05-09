# Architecture governance — HR ERP

Principal systems architecture for bounded contexts, databases, APIs, and async boundaries. **Payroll (and any non-owner context) must not mutate Core HR data stores**; integration is via **Kafka events** and **explicit read APIs** only.

**Agent skills:** Load **`@hr-erp-principal-architecture`** ([`.cursor/skills/hr-erp-principal-architecture/SKILL.md`](../../.cursor/skills/hr-erp-principal-architecture/SKILL.md)) for schemas, service splits, Kafka/outbox, and contracts—Orchestrator attaches it on Architecture Tasks. For DDL, migrations, backfills, and verification hooks, load **`@hr-db-migration-state`** ([`.cursor/skills/hr-db-migration-state/SKILL.md`](../../.cursor/skills/hr-db-migration-state/SKILL.md)).

## Where to start

| Artifact | Purpose |
| --- | --- |
| [Module proposal template](./module-proposal-template.md) | Required package before build: context, schema, APIs, events, lock ordering |
| [ADR template](../../specs/alignment/decisions/_TEMPLATE.md) | Decision record format (live ADRs numbered in same folder) |
| [Bounded contexts](./bounded-contexts.md) | Default service map and ownership |
| [SLO & load gates](./slo-and-load-gates.md) | Pooling, deadlock posture, observability checklist |
| [Database migrations & state custody](./database-migrations-and-state.md) | Multi-surface migrations, expand–contract, RLS, verification & fixtures |
| [contracts/README.md](../../contracts/README.md) | Buf (gRPC), OpenAPI (REST), lint/version policy |

Related product flow: [Feature brief template](../product/feature-brief-template.md) → architecture module proposal → implementation.
