---
name: hr-erp-principal-architecture
description: >-
  Principal systems architecture for HR ERP: bounded contexts, PostgreSQL-per-context
  databases, Kafka transactional outbox between contexts, hybrid REST/OpenAPI and
  gRPC/Protobuf contracts (Buf), Schema Registry, deadlock/SLO/load gates, and
  strict separation (Payroll never mutates Core HR DB—events + read APIs only).
  Use when proposing new modules, schemas, migrations, microservices, Kafka topics,
  internal APIs, cross-context integration, ADRs for data topology, scaling or
  deadlock posture, docker compose profile architecture, or when the user mentions
  Core HR vs Payroll boundaries, domain_outbox, or HR ERP greenfield architecture plan.
---

# HR ERP — Principal architecture (repo skill)

## Who must use this

**Orchestrator, Architecture agent, Implementation agents touching `prisma/**`, `services/**`, `workers/outbox-publisher/**`, `proto/**`, `contracts/**`, or `docker-compose.yml`** should load this skill for **non-trivial topology** (new aggregates across contexts, async boundaries, extraction toward dedicated databases). Narrow chores (copy, single-field rename in one table with no boundary change) may skip after logging **Architecture skill N/A** with one scope line in the PR or Task prompt.

Delegated **Cursor Task** agents performing **Architecture** work must receive this file path in the Task prompt (same pattern as `hr-erp-innovation-rd`).

## How to invoke

| Context | Action |
|--------|--------|
| This repo | **`@hr-erp-principal-architecture`** or open [SKILL.md](SKILL.md). |
| Cursor **Task** / subagent | Paste **`.cursor/skills/hr-erp-principal-architecture/SKILL.md`** into the Task prompt whenever the task drafts schemas, services split, Kafka/events, or cross-context contracts. |
| Another machine | Copy **`.cursor/skills/hr-erp-principal-architecture/`** into **`~/.cursor/skills/`** on that machine for cross-repo reuse (keep canonical docs in this repo). |

## Canonical docs (read in order)

1. [docs/architecture/README.md](../../../docs/architecture/README.md) — index.
2. [docs/architecture/bounded-contexts.md](../../../docs/architecture/bounded-contexts.md) — ownership and forbidden writes.
3. [docs/architecture/module-proposal-template.md](../../../docs/architecture/module-proposal-template.md) — required artifact before build for new modules.
4. [docs/architecture/slo-and-load-gates.md](../../../docs/architecture/slo-and-load-gates.md) — pooling, deadlocks, load-test gates.
5. [specs/alignment/decisions/0001-postgres-kafka-context-boundaries.md](../../../specs/alignment/decisions/0001-postgres-kafka-context-boundaries.md) — Postgres-per-context + Kafka ADR.
6. [specs/templates/architecture-spec.md](../../../specs/templates/architecture-spec.md) — per-feature spec (link filled module proposal).

## Non-negotiables

- **Single writer per aggregate** in its owning bounded context; **no cross-database FKs**—reference stable business IDs (e.g. `employee_id` UUID) as plain columns.
- **Payroll (and any non-owner) must not** use Core HR database credentials, shared-schema DML against Core HR tables, or write-back ETL into Core HR except through **Core HR’s own APIs** (prefer async commands with idempotency keys).
- **Async boundaries:** transactional **`domain_outbox`** in the **same** Postgres as the owning aggregate; relay to Kafka ([`workers/outbox-publisher/README.md`](../../../workers/outbox-publisher/README.md)). Topic naming: `hr.<context>.<aggregate>.v<major>` (see bounded-contexts doc).
- **Sync boundaries:** REST ([`contracts/openapi/`](../../../contracts/openapi/)) for gateways; gRPC-oriented contracts under [`proto/`](../../../proto/). Lint: `npm run contracts:buf`, `npm run contracts:openapi`.
- **Operational:** short transactions, documented **lock acquisition order** for multi-table writes, optimistic concurrency on hot rows; never hold DB locks across network I/O.
- **Phase alignment:** The Next.js app may still use a **single Prisma `DATABASE_URL`** today; **`docker compose --profile architecture`** provisions dedicated DBs + Kafka + Schema Registry for extraction and service rehearsals—do not silently collapse contexts in docs or ADRs without updating phase decisions under `specs/alignment/decisions/`.

## Deliverables checklist (new capability)

- [ ] Bounded context decision (new service vs existing)—see module proposal §1.
- [ ] Physical schema: tables, **FKs only inside same DB**, index plan, lock order §2.
- [ ] OpenAPI and/or Protobuf paths cited §3.
- [ ] Kafka topics, partition keys, consumer groups, idempotency §4.
- [ ] ADR updated or added when topology or breaking contract changes.

## Repo paths quick reference

| Concern | Location |
| --- | --- |
| Core HR / Payroll SQL migrations (bounded-context DBs) | `services/core-hr/db/migrations/`, `services/payroll/db/migrations/` |
| Compose (Kafka, registry, extra Postgres) | `docker-compose.yml` profile **`architecture`** |
| Env examples | `.env.example` (`CORE_HR_DATABASE_URL`, `PAYROLL_DATABASE_URL`, `KAFKA_BROKERS`) |
| ADR templates | `specs/alignment/decisions/_TEMPLATE.md` |

## Coordination with other skills

- **`hr-product-owner`** — Feature brief + UAC before architecture proposals for product-facing work.
- **`hr-erp-innovation-rd`** — Runs after topology draft per orchestrator; do not substitute this skill for Innovation parity.
- **`hr-backend-compliance`** — Any pay/time/compliance schema or API must stay aligned with `docs/compliance/`.
