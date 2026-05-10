# Local development — HR ERP

This guide gets a **working app + database** on your machine. For architecture theory, see [architecture/README.md](./architecture/README.md). For QA and fixtures, see [QA.md](./QA.md).

## Prerequisites

- **Node.js** 20+ (matches `@types/node` in `package.json`).
- **npm** (repo uses `package-lock.json`).
- **Docker Desktop** (or compatible engine) for Postgres and Redis.

Optional:

- **Python 3** + **uv** or **pip** for `services/ml-serving` and `services/pipelines` (predictive HR demos).

## 1. Install dependencies

```bash
cd /path/to/HR-ERP
npm ci
```

If `npm ci` fails repeatedly under cloud-synced folders (for example **Downloads** with iCloud), clone or copy the repo to a local-only path and retry once. See [CONTRIBUTING.md](../CONTRIBUTING.md).

## 2. Environment variables

Copy the template and edit secrets:

```bash
cp .env.example .env
```

- **`DATABASE_URL`** — default matches the `postgres` service in `docker-compose.yml` (published on host port **15432** by default; override with **`HR_ERP_PG_PUBLISH`** if that port is taken).
- **`JWT_SECRET`** — required for `/api/v1/*` (HS256). Use a long random string in production.
- **`REDIS_URL`** — default `redis://127.0.0.1:6379` for integration workers.
- Bounded-context vars (**`CORE_HR_DATABASE_URL`**, **`PAYROLL_DATABASE_URL`**, **`KAFKA_BROKERS`**) apply when you run the **architecture** Docker profile. See [.env.example](../.env.example) for the full list.

Never commit `.env` (it is gitignored).

## 3. Start infrastructure

**Minimal stack** (app DB + Redis — enough for most UI and Prisma workflows):

```bash
npm run db:up
```

**Architecture profile** (Kafka, Schema Registry, Core HR DB, Payroll DB — for outbox demos and multi-database work):

```bash
npm run db:up:arch
```

Wait until Postgres health checks pass (first boot can take a minute).

## 4. Database schema

Apply Prisma migrations to the main app database (non-interactive — safe for demos and CI‑like setups):

```bash
npm run db:migrate:deploy
```

**All-in-one demo data** (predictive HR seed, global L10n bootstrap, US/JP holiday fetch):

```bash
npm run demo:bootstrap
```

Flags: `--skip-migrate`, `--skip-predictive`, `--skip-holiday`, `--year=2026`. Set `ANALYTICS_DEMO_MODE=1` in `.env` for `/analytics/*` and **`/demo/capabilities`** (read-only Phase 3 seed snapshot: performance, compensation, positions, learning, workflow, engagement, webhooks, COBRA) in dev.

**Where the data lands:**

- **Docker Postgres (default dev):** Keep `DATABASE_URL` aligned with `docker-compose.yml` (host port **15432** unless you set `HR_ERP_PG_PUBLISH`), then run `npm run demo:bootstrap`. The predictive seed includes an idempotent **Phase 3** slice (performance / compensation cycles, positions, engagement, LMS, workflows, webhooks, COBRA) so existing volumes pick up new tables without `migrate reset`.
- **Neon (or other hosted Postgres):** Point `DATABASE_URL` at your connection string (use `sslmode=require` as your provider recommends). The CLI reads `DATABASE_URL` from `prisma.config.ts` for `npm run db:migrate:deploy` and the same demo scripts. If a **pooler** rejects DDL, apply migrations once using a **direct** URL in a shell override, for example `DATABASE_URL="$DIRECT_URL" npm run db:migrate:deploy`, then run `npm run demo:bootstrap` with your normal app URL. Optional `DEMO_WEBHOOK_PUBLISHER_SECRET` (32+ characters) customizes the seeded webhook subscription secret — see `.env.example`.

Use `npm run db:migrate` when you are authoring new migrations interactively (`prisma migrate dev`).

For a throwaway local reset when you accept data loss:

```bash
npx prisma migrate reset
```

Verify migration hygiene (orphan checks, optional advanced flows): `npm run db:verify`.

**Per-context SQL** under `services/core-hr/db/migrations/` and `services/payroll/db/migrations/` is separate from Prisma; follow [architecture/database-migrations-and-state.md](./architecture/database-migrations-and-state.md).

## 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With `ANALYTICS_DEMO_MODE=1` and `DEMO_TENANT_ID` set, open [http://localhost:3000/demo/capabilities](http://localhost:3000/demo/capabilities) for the Phase 3 seed snapshot (counts align after `npm run demo:bootstrap`).

### Authenticated API smoke tests

`/api/v1/*` expects `Authorization: Bearer <JWT>`. Issue a dev token (requires `JWT_SECRET` in `.env`):

```bash
node scripts/issue-dev-jwt.mjs
```

Use the printed token in `curl` or API clients.

## Repository layout (where code lives)

| Path | Role |
| --- | --- |
| `src/app/` | Next.js App Router: pages, layouts, route handlers |
| `src/components/` | Shared UI primitives (Radix-based) |
| `src/features/` | Feature-oriented UI modules |
| `lib/` | Server libraries shared by API routes (security, Prisma helpers, integrations) |
| `src/lib/` | Client-oriented helpers (`fetch`, errors, utils) |
| `prisma/` | App database schema and migrations |
| `packages/payroll-calc/` | Deterministic payroll calculation package (workspace) |
| `services/` | Python pipelines, ML serving, bounded-context SQL migrations |
| `workers/` | Kafka outbox publisher and related workers |
| `contracts/` | OpenAPI specs (Spectral lint) |
| `proto/` | Protobuf + Buf config |
| `tests/` | Vitest unit/integration + Playwright e2e |
| `scripts/` | One-off tooling (seed, security scan, QA helpers) |

Generated Prisma client output may appear under `src/app/generated/prisma/` after `prisma generate`; treat it as build output unless your team standardizes otherwise.

## Common npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit/integration per config) |
| `npm run test:e2e` | Playwright |
| `npm run security:scan` | Custom security scan (see `scripts/security-scan.mjs`) |
| `npm run contracts:openapi` | Spectral lint on `contracts/openapi/` |
| `npm run contracts:buf` | Buf lint on `proto/` |
| `npm run db:studio` | Prisma Studio |
| `npm run db:migrate:deploy` | Apply migrations (`prisma migrate deploy`) |
| `npm run db:migrate` | Interactive migration authoring (`prisma migrate dev`) |
| `npm run demo:bootstrap` | Migrate + predictive seed + L10n + US/JP holidays (see flags in §4) |
| `npm run db:seed:predictive` | Seed predictive HR demo data |
| `npm run outbox:kafka` | Run outbox publisher (needs Kafka + `OUTBOX_DATABASE_URL` / env from `.env.example`) |
| `npm run worker:integrations` | Integration worker entry (Redis / BullMQ) |

Full list: root `package.json` → `"scripts"`.

## Contracts and quality gates

Before opening a PR that changes HTTP shapes or protos:

```bash
npm run contracts:openapi
npm run contracts:buf
```

OpenAPI lives in `contracts/openapi/`; Spectral rules in `contracts/.spectral.yaml`.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `P1001` / DB connection errors | `docker compose ps`, `DATABASE_URL` host/port |
| 401 on `/api/v1/*` | `JWT_SECRET` set; token issued with same secret |
| Redis / worker failures | `REDIS_URL`; `npm run db:up` includes Redis |
| Kafka / outbox errors | `npm run db:up:arch`; brokers in `.env`; correct `OUTBOX_DATABASE_URL` |
| Prisma client drift | `npm run db:generate` after schema changes |

## Further reading

- [README.md](../README.md) — overview and links
- [FRONTEND.md](../FRONTEND.md) — UI patterns
- [security/agent-mcp-threat-model.md](./security/agent-mcp-threat-model.md) — agents and MCP boundaries
