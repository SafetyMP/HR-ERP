---
name: hr-data-custody
description: >-
  Change HR-ERP Prisma/SQL and RLS-safe migrations. Use for DDL, backfills, or
  db:verify — this is a high-risk fixture domain, not a payroll product.
risk: high
minRiskTier: T2
source: project
disable-model-invocation: true
---

# HR data custody

Community copy of the in-IDE skill at [`.cursor/skills/hr-data-custody/SKILL.md`](../../../.cursor/skills/hr-data-custody/SKILL.md). Payroll/ESS schema is a **fixture domain** for agent-governance blast radius — not a payroll product.

**Collaboration plane:** Specialized skill — invoke only after phase 6 / `revalidationConfirmed`. Record DDL tradeoffs in [collaboration-plan.md](../../../specs/templates/collaboration-plan.md).

## Use this skill when

- Editing `prisma/schema.prisma`, `prisma/migrations/**`, `services/*/db/migrations/**`
- Backfills, RLS migrations, or `scripts/db-verify-migration.ts`
- Dockerfile, GHCR publish, SBOM/Cosign (ADR 0003)

## Do not use this skill when

- Read-only schema questions with no migration intent
- Application code with no DDL/infra change
- Trying to “complete” an HRIS against ERPNext — see [docs/DESIGN-PIVOT.md](../../../docs/DESIGN-PIVOT.md)

## Instructions

1. Read [references/migration-runbook.md](references/migration-runbook.md).
2. Apply expand → migrate → contract; CONCURRENTLY discipline for indexes.
3. Run `npm run db:verify` after migrate deploy in CI/local evidence.
4. Co-load `@hr-domain-boundaries` when bounded-context SQL changes.

## Resources

- [references/migration-runbook.md](references/migration-runbook.md)
- [specs/alignment/decisions/0003-container-supply-chain.md](../../../specs/alignment/decisions/0003-container-supply-chain.md)

## Limitations

- Zero-downtime posture required for production-like fixture paths
- Never migrate real employee or tax PII
