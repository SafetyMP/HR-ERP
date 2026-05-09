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
# Edit JWT_SECRET. Default app DB listens on host port **15432** (`docker-compose.yml`); override with `HR_ERP_PG_PUBLISH` if needed.

npm run db:up
npm run demo:bootstrap
npm run dev
```

`demo:bootstrap` applies Prisma migrations (unless you pass `--skip-migrate`), runs predictive HR seed, global L10n demo data, and a US/JP holiday import. Set `ANALYTICS_DEMO_MODE=1` in `.env` for `/analytics/*` pages.

Open [http://localhost:3000](http://localhost:3000).

**Full setup** (multiple databases, Kafka, workers): see **[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)**.

## Documentation

| Resource | Description |
| --- | --- |
| **[`docs/README.md`](docs/README.md)** | Index of all major documentation |
| **[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)** | Local dev, scripts, repo layout, troubleshooting |
| **[`CONTRIBUTING.md`](CONTRIBUTING.md)** | PR expectations, migrations, synthetic data |
| **[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)** | Community norms (Contributor Covenant) |
| **[`SECURITY.md`](SECURITY.md)** | Vulnerability disclosure (private reporting preferred) |
| **[`CHANGELOG.md`](CHANGELOG.md)** | Release history (maintained via automation) |
| **[`docs/QA.md`](docs/QA.md)** | Tests, fixtures, failure envelopes |
| **[`FRONTEND.md`](FRONTEND.md)** | UI state, accessibility, API error handling |

## Tech stack

- **Runtime**: Node **22+** (pinned in CI/Docker image; Node 20 LTS remains compatible for local-only use), **Next.js 16**, **React 19**, **TypeScript**
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
| `npm run db:migrate:deploy` | Apply migrations (demo / CI) |
| `npm run demo:bootstrap` | One-shot local demo data (seeds + L10n + holidays) |
| `npm run db:migrate` | Author migrations interactively (`migrate dev`) |
| `npm run db:studio` | Prisma Studio |
| `npm run contracts:openapi` / `contracts:buf` | Contract lint |

See **`package.json`** for the complete list.

## Security architecture

- **Docs**: [`docs/security/stack-decision.md`](docs/security/stack-decision.md), [`docs/security/policy-catalog.md`](docs/security/policy-catalog.md), [`docs/security/rls-session-contract.md`](docs/security/rls-session-contract.md), [`docs/security/tls-and-data-at-rest.md`](docs/security/tls-and-data-at-rest.md)
- **CI**: [`npm run security:scan`](scripts/security-scan.mjs); ESLint bans unsafe raw SQL helpers ([`eslint.config.mjs`](eslint.config.mjs))
- **Dev JWT**: `node scripts/issue-dev-jwt.mjs` (requires `JWT_SECRET` in `.env`)

## Predictive HR (churn, skills, benchmarks)

- **Schema**: [`prisma/schema.prisma`](prisma/schema.prisma) — e.g. `Department`, `JobRole`, `ChurnScore`, `MarketBenchmark`
- **Seed**: `npm run demo:bootstrap` or `npm run db:seed:predictive` — use the same `DEMO_TENANT_ID` as [`lib/l10n/demo-tenant.ts`](lib/l10n/demo-tenant.ts) (default `default-tenant`); set `ANALYTICS_DEMO_MODE=1` for demo UIs under [`src/app/analytics`](src/app/analytics)
- **APIs**: [`src/app/api/v1`](src/app/api/v1) — `analytics/churn`, `analytics/skills/match`, `analytics/benchmarks`, `ml/churn/score`
- **Python**: train [`services/pipelines/train_churn.py`](services/pipelines/train_churn.py); serve with `uvicorn churn_api:app --app-dir services/ml-serving --port 8090`; ETL [`services/pipelines/etl_features.py`](services/pipelines/etl_features.py)
- **Privacy**: [`docs/anonymization.md`](docs/anonymization.md)

## Releases & container publishing

- **SemVer + releases:** Bump `version` in root [`package.json`](package.json) on `main` / `master` (with [`CHANGELOG.md`](CHANGELOG.md) updated in the same PR). [`.github/workflows/release-tag.yml`](.github/workflows/release-tag.yml) creates the `v*` git tag and a **published** GitHub Release when it detects a version change (or re-run via **workflow_dispatch**). This triggers **GHCR** below without opening a release PR.
- **GHCR image:** Publishing a **[GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)** runs [`.github/workflows/publish-ghcr.yml`](.github/workflows/publish-ghcr.yml), which builds **multi-arch** (`linux/amd64`, `linux/arm64`) images, attaches **SBOM** and **SLSA-style provenance** attestations, pushes `ghcr.io/<lowercased-github-owner>/<lowercased-repo-name>:<version>` plus `:latest`, and **Cosign-signs** the image digest (keyless via GitHub OIDC). Manual smoke builds use **`workflow_dispatch`** with a scratch tag.
- **Supply-chain policy:** [`specs/alignment/decisions/0003-container-supply-chain.md`](specs/alignment/decisions/0003-container-supply-chain.md). **Verify** a pulled digest (replace `OWNER`, `REPO`, and `DIGEST`):

```bash
cosign verify "ghcr.io/OWNER/REPO@sha256:DIGEST" \
  --certificate-identity-regexp '^https://github.com/OWNER/REPO/\.github/workflows/publish-ghcr\.yml@.*' \
  --certificate-oidc-issuer-regexp '^https://token.actions.githubusercontent.com$'
```

```bash
docker build -t hr-erp:local .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL='postgresql://user:pass@host:5432/db?sslmode=require' \
  -e JWT_SECRET='replace-with-production-secret-at-least-32-chars' \
  hr-erp:local
```

## Contributing

Issues and PRs welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md), [`SECURITY.md`](SECURITY.md), and [`docs/community/README.md`](docs/community/README.md). Maintainer playbook for branches and CI checks: [`docs/community/github-branch-protection.md`](docs/community/github-branch-protection.md).

## License

This project includes the [`LICENSE`](LICENSE) file from the GitHub repository (Apache-2.0 unless the file states otherwise).
