# Database migrations and state custody

**Cursor skill:** **`@hr-data-custody`** — [`.cursor/skills/hr-data-custody/SKILL.md`](../../.cursor/skills/hr-data-custody/SKILL.md). Listed in [AGENTS.md](../../AGENTS.md).

Engineering runbook for **non-destructive** schema evolution and **historical data custody** across this repo’s Postgres surfaces. Pair with ADR [`specs/alignment/decisions/0002-postgres-kafka-context-boundaries.md`](../../specs/alignment/decisions/0002-postgres-kafka-context-boundaries.md) (no cross-database foreign keys; migrations **per** database).

## Migration surfaces

| Surface | Location | Apply | Typical `DATABASE_URL` / DSN |
| --- | --- | --- | --- |
| App (Next.js + Prisma) | [`prisma/schema.prisma`](../../prisma/schema.prisma), [`prisma/migrations/`](../../prisma/migrations/) | `npx prisma migrate dev` (local), `npx prisma migrate deploy` (CI/prod) | `DATABASE_URL` |
| Core HR (bounded context) | [`services/core-hr/db/migrations/`](../../services/core-hr/db/migrations/) | `psql "$CORE_HR_DATABASE_URL" -v ON_ERROR_STOP=1 -f …` | See [`services/core-hr/db/README.md`](../../services/core-hr/db/README.md) |
| Payroll (bounded context) | [`services/payroll/db/migrations/`](../../services/payroll/db/migrations/) | `psql "$PAYROLL_DATABASE_URL" -v ON_ERROR_STOP=1 -f …` | See [`services/payroll/db/README.md`](../../services/payroll/db/README.md) |

Architecture agents follow **forward-only** migrations on shared branches ([`.cursor/rules/agent-architecture.mdc`](../../.cursor/rules/agent-architecture.mdc)).

## Row Level Security (Prisma app DB)

Several tenant-scoped tables use RLS with session GUCs (`app.tenant_id`, often `app.subject_id`). Application code and seeds must run mutations inside a transaction that calls `set_config` first — see [`scripts/seed-predictive-demo.ts`](../../scripts/seed-predictive-demo.ts) and integration tests under [`tests/integration/`](../../tests/integration/).

Structural changes must preserve existing policies or add compatible policies; failing to do so can make rows invisible under normal sessions.

## Zero-downtime default: expand → migrate → contract

1. **Expand** — Add new nullable columns, new tables, or secondary indexes **without** long-blocking DDL on hot paths. Prefer additive changes.
2. **Migrate** — Backfill in **batches** or via jobs; use **dual-write** when both old and new representations must stay authoritative until cutover. Document reconciliation or drain criteria (aligned with [`docs/architecture/02-phase-bc-edge-semantic-search.md`](./02-phase-bc-edge-semantic-search.md) dual-write language for derived stores).
3. **Contract** — Add `NOT NULL`, FKs, uniqueness, or drop obsolete columns **only after** backfill completeness is proven (counts + spot queries + automated checks below).

## PostgreSQL locking notes

- **Secondary indexes** on large tables: prefer `CREATE INDEX CONCURRENTLY` / `DROP INDEX CONCURRENTLY`. These cannot run inside a transaction block; Prisma wraps each migration file in a transaction — if generated SQL is blocking, split work into a **hand-edited** migration, a manual `psql` rollout step, or a dedicated maintenance window documented in the PR.
- **Heavy rewrites** — Consider copy-to-new-table + swap only when justified; document ordering (traffic drain, dual-write stop, final rename).

## Automated integrity verification (app DB)

After `prisma migrate deploy` (locally or in CI), run:

```bash
npm run db:verify
```

See [`scripts/db-verify-migration.ts`](../../scripts/db-verify-migration.ts). It runs **read-only** orphan / alignment predicates. Extend this script when new FK-heavy domains land.

**Production / least-privilege:** Verification needs visibility across tenants for global orphan detection. The Docker Compose default `POSTGRES_USER` is the cluster superuser and bypasses RLS. In production, run checks using a dedicated role with **`BYPASSRLS`** (or equivalent ops-only access), not end-user application roles.

## Synthetic fixtures → hydrated DB (UI / agents)

1. Generate JSON (gitignored output):

   ```bash
   npx tsx scripts/qa-generate-fixture-batch.ts --seed=12345 --count=5000
   ```

2. Load a capped subset into Postgres:

   ```bash
   npm run db:load:fixtures -- --file=tests/generated/employees_seed_12345_n_5000.json --max=200
   ```

See [`scripts/db-load-employee-scenarios.ts`](../../scripts/db-load-employee-scenarios.ts). Data policy: [`docs/QA.md`](../QA.md) synthetic-data rules only.

## PR checklist (migration custodian)

- [ ] Which surface(s) changed (Prisma / Core HR SQL / Payroll SQL)?
- [ ] Expand–contract steps documented if production-shaped.
- [ ] `npm run db:verify` (and Core HR / Payroll equivalents when those DBs change — add matching scripts as those schemas grow).
- [ ] RLS / `set_config` paths updated if tenant tables changed.
- [ ] Payroll or compliance persistence touched → coordinate [`docs/compliance/`](../compliance/) and golden vectors / [`packages/payroll-calc/`](../../packages/payroll-calc/) as applicable.

## Related docs

- [`docs/QA.md`](../QA.md) — layered tests, `FAILURE_SUMMARY`, fixture layout.
- [`docs/architecture/slo-and-load-gates.md`](./slo-and-load-gates.md) — locks / wait events observability.
