# HR ERP

Human Resources **enterprise scaffold**: **Next.js** (App Router) + **PostgreSQL** (Prisma) with strong defaults for **multi-tenant security**, **integrations** (Redis, optional Kafka), **payroll calculation** (`packages/payroll-calc`), and extensive **governance docs** (compliance, AI ethics, architecture ADRs).

The repository is set up for **human contributors and Cursor-orchestrated agents**; workflow rules live in [`AGENTS.md`](AGENTS.md).

## What is in this repo

- **Web app**: `src/app/` — dashboards (`/analytics`), examples, global L10n lab, governance APIs, versioned REST under `/api/v1`.
- **Data plane**: `prisma/` — main app DB with RLS-oriented migrations; optional **bounded-context** Postgres instances via Docker profile (see [`docker-compose.yml`](docker-compose.yml)).
- **Security**: JWT gate in [`middleware.ts`](middleware.ts) for `/api/v1/*`; transactions with tenant session GUCs via [`lib/security/with-authorized-transaction.ts`](lib/security/with-authorized-transaction.ts).
- **Contracts**: OpenAPI (`contracts/openapi/`) + Protobuf [`proto/`](proto/) with npm lint shortcuts.
- **Workers**: Outbox → Kafka ([`workers/outbox-publisher/`](workers/outbox-publisher/)); BullMQ integration jobs ([`npm run worker:integrations`](package.json)).
- **ML / analytics (optional)**: Python under [`services/`](services/) — churn training, ETL, FastAPI serving; documented in **Predictive HR** below.

## Quick start

```bash
git clone https://github.com/SafetyMP/HR-ERP.git
cd HR-ERP
npm ci
cp .env.example .env
# Edit JWT_SECRET and any URLs if your Docker ports differ

npm run db:up
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Full setup** (multiple databases, Kafka, workers): see **[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)**.

## Documentation

| Resource | Description |
| --- | --- |
| **[`docs/README.md`](docs/README.md)** | Index of all major documentation |
| **[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)** | Local dev, scripts, repo layout, troubleshooting |
| **[`CONTRIBUTING.md`](CONTRIBUTING.md)** | PR expectations, migrations, synthetic data |
| **[`docs/QA.md`](docs/QA.md)** | Tests, fixtures, failure envelopes |
| **[`FRONTEND.md`](FRONTEND.md)** | UI state, accessibility, API error handling |

## Tech stack

- **Runtime**: Node 20+, **Next.js 16**, **React 19**, **TypeScript**
- **Data**: **Prisma 7**, PostgreSQL (**pgvector** image in Compose for default DB)
- **UI**: **Tailwind CSS 4**, **Radix** primitives, **TanStack Query / Table**, **Recharts**
- **Validation**: **Zod**, **React Hook Form**
- **Tests**: **Vitest**, **Playwright**
- **Tooling**: **ESLint** (Next config), **Prettier**, **Buf**, **Spectral**

## npm scripts (shortlist)

| Command | Use |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` / `npm run test:e2e` | Vitest / Playwright |
| `npm run security:scan` | Repo security scan |
| `npm run db:up` / `npm run db:up:arch` | Docker: default vs architecture profile |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:studio` | Prisma Studio |
| `npm run contracts:openapi` / `contracts:buf` | Contract lint |

See **`package.json`** for the complete list.

## Security architecture

- **Docs**: [`docs/security/stack-decision.md`](docs/security/stack-decision.md), [`docs/security/policy-catalog.md`](docs/security/policy-catalog.md), [`docs/security/rls-session-contract.md`](docs/security/rls-session-contract.md), [`docs/security/tls-and-data-at-rest.md`](docs/security/tls-and-data-at-rest.md)
- **CI**: [`npm run security:scan`](scripts/security-scan.mjs); ESLint bans unsafe raw SQL helpers ([`eslint.config.mjs`](eslint.config.mjs))
- **Dev JWT**: `node scripts/issue-dev-jwt.mjs` (requires `JWT_SECRET` in `.env`)

## Predictive HR (churn, skills, benchmarks)

- **Schema**: [`prisma/schema.prisma`](prisma/schema.prisma) — e.g. `Department`, `JobRole`, `ChurnScore`, `MarketBenchmark`
- **Seed**: `npm run db:seed:predictive` — set `DEMO_TENANT_ID` and `ANALYTICS_DEMO_MODE=1` for demo UIs under [`src/app/analytics`](src/app/analytics)
- **APIs**: [`src/app/api/v1`](src/app/api/v1) — `analytics/churn`, `analytics/skills/match`, `analytics/benchmarks`, `ml/churn/score`
- **Python**: train [`services/pipelines/train_churn.py`](services/pipelines/train_churn.py); serve with `uvicorn churn_api:app --app-dir services/ml-serving --port 8090`; ETL [`services/pipelines/etl_features.py`](services/pipelines/etl_features.py)
- **Privacy**: [`docs/anonymization.md`](docs/anonymization.md)

## Contributing

Issues and PRs welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/community/README.md`](docs/community/README.md).

## License

This project includes the [`LICENSE`](LICENSE) file from the GitHub repository (Apache-2.0 unless the file states otherwise).
