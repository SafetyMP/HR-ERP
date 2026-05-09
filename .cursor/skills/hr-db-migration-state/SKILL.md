---
name: hr-db-migration-state
description: >-
  Guides safe, non-destructive Postgres evolution for this HR ERP: three migration
  surfaces (Prisma app DB, Core HR SQL, Payroll SQL), expand–migrate–contract and
  CONCURRENTLY discipline, RLS session GUCs with seeds and loaders, post-migrate
  orphan verification (npm run db:verify), and synthetic fixture hydration for UI/QA.
  Use when editing prisma/schema.prisma or prisma/migrations, services/*/db/migrations,
  data backfills, dual-write or shadow-read rollouts, extending verification scripts,
  payroll/compliance row custody, or when the user mentions zero-downtime migration,
  migration custody, or DB state engineering.
---

# HR ERP database migration & state custody (repo skill)

## Canonical doc (read first)

[docs/architecture/database-migrations-and-state.md](../../../docs/architecture/database-migrations-and-state.md) — surfaces, RLS, expand→migrate→contract, tooling, PR checklist.

## Boundaries

- **No cross-database FKs** — align with [specs/alignment/decisions/0001-postgres-kafka-context-boundaries.md](../../../specs/alignment/decisions/0001-postgres-kafka-context-boundaries.md); migrations **per** DSN.
- **Forward-only** on shared branches — [.cursor/rules/agent-architecture.mdc](../../rules/agent-architecture.mdc).
- **Custody:** structural changes must not silently truncate payroll, compliance audit, or governance history; prove completeness with counts + automated checks before contracting DDL.

## Three surfaces (pick the right tree)

| Surface | Path | Apply |
| --- | --- | --- |
| App | `prisma/schema.prisma`, `prisma/migrations/` | `prisma migrate dev` / `deploy` |
| Core HR | `services/core-hr/db/migrations/` | `psql` per service README |
| Payroll | `services/payroll/db/migrations/` | `psql` per service README |

Document in the PR which surface(s) changed and any manual `psql` steps.

## Engineering checklist

- [ ] **Expand → migrate → contract** for production-shaped changes; document dual-write + reconciliation when both representations are authoritative.
- [ ] **Locking:** avoid long blocking DDL; `CREATE INDEX CONCURRENTLY` cannot run inside Prisma’s migration transaction — split rollout when needed (runbook).
- [ ] **RLS:** preserve `set_config('app.tenant_id', …)` (and related GUCs) for mutations; mirror patterns in [scripts/seed-predictive-demo.ts](../../../scripts/seed-predictive-demo.ts) and [scripts/db-load-employee-scenarios.ts](../../../scripts/db-load-employee-scenarios.ts).
- [ ] **Verify:** extend [scripts/db-verify-migration.ts](../../../scripts/db-verify-migration.ts) when new FK-heavy domains land; run **`npm run db:verify`** after migrate (CI integration job runs it post-deploy).
- [ ] **Payroll / compliance persistence:** coordinate [docs/compliance/](../../../docs/compliance/), **`hr-backend-compliance`**, and **`hr-payroll-calculation-engine`** when persisted inputs touch executable pay math or fingerprints/replay.
- [ ] **Governance / audit tables:** treat append-only and tenant policies carefully when touching AI HITL migrations (see runbook + governance migrations).

## Commands (repo)

```bash
npx prisma migrate deploy          # app DB
npm run db:verify                   # read-only orphan smoke (requires DATABASE_URL)
npm run db:load:fixtures -- --file=tests/generated/<batch>.json --max=200
npx tsx scripts/qa-generate-fixture-batch.ts --seed=12345 --count=5000
```

Synthetic data policy: [docs/QA.md](../../../docs/QA.md).

## Coordination with other agents

- **`@hr-erp-principal-architecture`** — bounded contexts and schema sketches; co-load this skill whenever deliverables include **DDL or migration plans**.
- **`hr-backend-compliance`** / **`hr-payroll-calculation-engine`** — when migrations touch pay, time, earnings, or kernel inputs.
- **`hr-erp-security-identity`** — RLS, Prisma migrations, tenant isolation regressions.
- **`hr-erp-qa-chaos`** — mega-fixtures, integration DB setup; link verification failures via **FAILURE_SUMMARY** in [docs/QA.md](../../../docs/QA.md).

## Global reuse

Copy or symlink this folder to `~/.cursor/skills/hr-db-migration-state/` for other workspaces; replace repo-relative links with paths into this clone.
