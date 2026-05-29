---
name: hr-domain-boundaries
description: >-
  HR ERP bounded contexts: Postgres-per-context, Kafka outbox, Payroll never
  mutates Core HR DB, REST/gRPC contracts. Use for schemas, services, migrations,
  cross-context APIs, docker topology, or module proposals in this repo.
risk: medium
minRiskTier: T1
source: project
disable-model-invocation: true
---

# HR domain boundaries

## Use this skill when

- Architecture Tasks touching `prisma/`, `services/`, `contracts/`, `proto/`
- New modules or cross-context integration
- Innovation/R&D parity when infra or async boundaries change

## Do not use this skill when

- Copy/CSS-only or single-table field rename with no boundary impact
- Regulated pay math (use `hr-regulated-domain`)

## Instructions

1. Read [references/boundary-checklist.md](references/boundary-checklist.md).
2. Fill `specs/templates/architecture-spec.md` for the feature.
3. Link module proposal per `docs/architecture/module-proposal-template.md`.
4. Innovation parity: mark N/A with one line when no stack/extraction change.

## Resources

- [references/boundary-checklist.md](references/boundary-checklist.md)
- [docs/architecture/bounded-contexts.md](../../../docs/architecture/bounded-contexts.md)

## Limitations

- Phase 1 may use single app DB with logical contexts — follow phase ADR
