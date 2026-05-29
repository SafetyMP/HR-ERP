---
name: hr-data-custody
description: >-
  HR ERP database migrations and packaging: Prisma/SQL surfaces, expand-migrate-contract,
  RLS-safe seeds, db:verify, distroless/GHCR supply chain. Use for DDL, backfills,
  dual-write cutovers, Dockerfile, or publish-ghcr workflows.
risk: high
minRiskTier: T2
source: project
disable-model-invocation: true
---

# HR data custody

## Use this skill when

- Editing `prisma/schema.prisma`, `prisma/migrations/**`, `services/*/db/migrations/**`
- Backfills, RLS migrations, or `scripts/db-verify-migration.ts`
- Dockerfile, GHCR publish, SBOM/Cosign (ADR 0003)

## Do not use this skill when

- Read-only schema questions with no migration intent
- Application code with no DDL/infra change

## Instructions

1. Read [references/migration-runbook.md](references/migration-runbook.md).
2. Apply expand → migrate → contract; CONCURRENTLY discipline for indexes.
3. Run `npm run db:verify` after migrate deploy in CI/local evidence.
4. Co-load `@hr-domain-boundaries` when bounded-context SQL changes.

## Resources

- [references/migration-runbook.md](references/migration-runbook.md)
- [specs/alignment/decisions/0003-container-supply-chain.md](../../../specs/alignment/decisions/0003-container-supply-chain.md)

## Limitations

- Zero-downtime posture required for production paths
