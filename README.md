# HR ERP

Human Resources **enterprise scaffold**: **Next.js** (App Router) + **PostgreSQL** (Prisma) with defaults for **multi-tenant security**, **integrations** (Redis, optional Kafka), **payroll calculation** ([`packages/payroll-calc`](packages/payroll-calc)), and **governance** docs (compliance, AI ethics, architecture ADRs).

The repo supports **human contributors and Cursor-orchestrated agents**; orchestration rules live in [`AGENTS.md`](AGENTS.md).

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-22+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**Jump to:** [Prerequisites](#prerequisites) · [Quick start](#quick-start) · [Authentication](#authentication--api-access) · [Documentation](#documentation) · [Tech stack](#tech-stack) · [Security](#security-architecture) · [Containers](#releases--container-publishing) · [Contributing](#contributing) · [License](#license)

---

## Overview

| Area | Location |
| --- | --- |
| **Web app** | [`src/`](src/README.md) — **employee home** ([`/employee`](src/app/employee/)) with Feature **022** shell; manager/HR routes; dashboards (`/analytics`); **Phase 3 capability hub** (`/demo/capabilities` when `ANALYTICS_DEMO_MODE=1`); L10n lab; governance APIs; versioned REST under `/api/v1`. |
| **Server modules** | [`lib/`](lib/README.md) — domain logic, security, integrations ([`CODEBASE.md`](CODEBASE.md)) |
| **Data plane** | [`prisma/`](prisma/) — app DB and RLS-oriented migrations; optional **bounded-context** Postgres via Docker ([`docker-compose.yml`](docker-compose.yml)). |
| **Security** | [`middleware.ts`](middleware.ts) for `/api/v1/*`; tenant session GUCs via [`lib/security/with-authorized-transaction.ts`](lib/security/with-authorized-transaction.ts). |
| **Contracts** | OpenAPI in [`contracts/openapi/`](contracts/openapi/) and Protobuf in [`proto/`](proto/) (see `npm run contracts:*`). |
| **Workers** | Outbox → Kafka ([`workers/outbox-publisher/`](workers/outbox-publisher/)); BullMQ jobs (`npm run worker:integrations`). |
| **ML / analytics (optional)** | Python under [`services/`](services/) — training, ETL, FastAPI serving (see [Predictive HR](#predictive-hr-churn-skills-benchmarks)). |

---

## Prerequisites

- **Node.js** **22+** (matches CI and the production container; older Node may work for local-only experiments).
- **npm** (comes with Node; the repo uses a committed lockfile — prefer `npm ci` for clean installs).
- **Docker** (optional, recommended) for Postgres, Redis, and optional Kafka/architecture profiles via Compose.

---

## Quick start

```bash
git clone https://github.com/SafetyMP/HR-ERP.git
cd HR-ERP
npm ci
cp .env.example .env
```

Edit **`JWT_SECRET`** in `.env`. The default app database is exposed on host port **15432** (see [`docker-compose.yml`](docker-compose.yml)); override with **`HR_ERP_PG_PUBLISH`** if that port is taken.

```bash
npm run db:up
npm run demo:bootstrap
npm run dev
```

- **`demo:bootstrap`** applies Prisma migrations (unless you pass `--skip-migrate`), predictive HR seed, global L10n demo data, US/JP holiday import, and the **Phase 3** snapshot slice (performance, compensation, LMS, workflow, engagement, webhooks, COBRA).
- Set **`ANALYTICS_DEMO_MODE=1`** and **`DEMO_TENANT_ID`** (must match your seeded tenant) in `.env` to enable **read-only demo Postgres surfaces**: predictive dashboards under [`src/app/analytics`](src/app/analytics) and the **[capability hub](http://localhost:3000/demo/capabilities)** (`/demo/capabilities`).

Open [http://localhost:3000/employee](http://localhost:3000/employee) for the **employee portal** (pay, time, PTO, benefits, profile). The marketing home at `/` links manager/HR paths; with `ANALYTICS_DEMO_MODE=1`, use **Platform capabilities (Phase 3)** at `/demo/capabilities` and **Analytics & global labs** for churn/skills/benchmarks/L10n.

**Buyer demos:** Use W1–W5 ESS paths only — do not list Track D, `/mock`, or `/global-l10n` as shipped product ([`docs/product/deferred-platform-track.md`](docs/product/deferred-platform-track.md)).

**Deeper setup** (multiple databases, Kafka, workers, sign-in): [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

---

## Documentation

Full index: **[`docs/README.md`](docs/README.md)**.

### Getting started

| Resource | Description |
| --- | --- |
| [`CODEBASE.md`](CODEBASE.md) | Where code lives: `lib/`, `src/`, `scripts/`, `tests/` |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Local dev, auth, scripts, layout, troubleshooting |
| [`docs/QA.md`](docs/QA.md) | Tests, fixtures, `FAILURE_SUMMARY` handoffs |
| [`FRONTEND.md`](FRONTEND.md) | UI patterns, employee shell (022), a11y, API errors |
| [`docker/README.md`](docker/README.md) | OCI image and Compose overlay |

### Product and agents

| Resource | Description |
| --- | --- |
| [`docs/product/stakeholder-value-plan.md`](docs/product/stakeholder-value-plan.md) | Active forward plan (Track A/B/C, W1–W7) |
| [`docs/product/reference-customer-exit-runbook.md`](docs/product/reference-customer-exit-runbook.md) | Reference customer exit |
| [`AGENTS.md`](AGENTS.md) | Cursor orchestration, skills, Definition of Done |
| [`docs/meta/cursor-3-native-runtime.md`](docs/meta/cursor-3-native-runtime.md) | Operator loop (`governance:*`, `/multitask`) |

### Engineering and community

| Resource | Description |
| --- | --- |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branches, PR bar, migrations, synthetic data |
| [`SECURITY.md`](SECURITY.md) | Vulnerability disclosure |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Community norms |
| [`CHANGELOG.md`](CHANGELOG.md) | Release history (semantic-release) |

---

## Authentication & API access

| Context | How |
| --- | --- |
| **Local API** | `npm run jwt:dev` (or `jwt:dev:demo-employee`, `jwt:dev:demo-manager`, `jwt:dev:demo-hr`) — signs with `JWT_SECRET` in `.env`; see [`.env.example`](.env.example). |
| **Vercel production API** | `npm run jwt:dev:vercel` uses deployment secrets; production mint requires `ALLOW_PRODUCTION_JWT_MINT=1` (Human authorization). |
| **Browser sign-in** | Neon Auth (Google) or OIDC when configured — [phase 1 production checklist](docs/operations/phase1-production-checklist.md). |
| **Demo preview** | Automatic on Vercel Preview and local dev; Production requires explicit flags — see checklist and [`AGENTS.md`](AGENTS.md) safety notes. |

`/api/v1/*` expects `Authorization: Bearer <JWT>` unless a route documents session/cookie auth.

---

## Tech stack

- **Runtime:** Node **22+**, **Next.js 16**, **React 19**, **TypeScript**
- **Data:** **Prisma 7**, PostgreSQL (**pgvector** image in Compose for the default DB)
- **UI:** **Tailwind CSS 4**, **Radix** primitives, **TanStack Query / Table**, **Recharts**
- **Validation:** **Zod**, **React Hook Form**
- **Tests:** **Vitest**, **Playwright**
- **Tooling:** **ESLint** (Next config), **Prettier**, **Buf**, **Spectral**

---

## npm scripts (shortlist)

### App and quality

| Command | Use |
| --- | --- |
| `npm run dev` / `build` / `start` | Dev server, production build, serve |
| `npm run lint` | ESLint |
| `npm run test` / `test:e2e` | Vitest / Playwright |
| `npm run security:scan` | Repository security scan |
| `npm run contracts:openapi` / `contracts:buf` | Contract lint |

### Database and demo

| Command | Use |
| --- | --- |
| `npm run db:up` / `db:up:arch` | Docker: default stack vs architecture profile |
| `npm run db:migrate:deploy` / `db:migrate` | Deploy vs author migrations |
| `npm run demo:bootstrap` | One-shot local demo data |
| `npm run db:studio` | Prisma Studio |

### Auth, governance, and ops

| Command | Use |
| --- | --- |
| `npm run jwt:dev` / `jwt:dev:demo-*` | Dev JWT — [Authentication](#authentication--api-access) |
| `npm run governance:lint` / `governance:ci` | Agent harness tier + merge gates |
| `npm run check:lib-boundaries` | Forbidden cross-import check |
| `npm run verify:reference-exit` | Reference-customer exit artifact check |
| `npm run ops:smoke` | Staging smoke — [phase 1 checklist](docs/operations/phase1-production-checklist.md) |
| `npm run worker:integrations` / `worker:webhooks` | BullMQ workers |

See [`package.json`](package.json) for the full list.

---

## Security architecture

- **Docs:** [`docs/security/stack-decision.md`](docs/security/stack-decision.md), [`docs/security/policy-catalog.md`](docs/security/policy-catalog.md), [`docs/security/rls-session-contract.md`](docs/security/rls-session-contract.md), [`docs/security/tls-and-data-at-rest.md`](docs/security/tls-and-data-at-rest.md)
- **CI:** [`npm run security:scan`](scripts/security-scan.mjs); ESLint rules around unsafe raw SQL ([`eslint.config.mjs`](eslint.config.mjs))
- **Dev JWT:** `npm run jwt:dev` (requires `JWT_SECRET` in `.env`)

---

## Predictive HR (churn, skills, benchmarks)

- **Schema:** [`prisma/schema.prisma`](prisma/schema.prisma) — e.g. `Department`, `JobRole`, `ChurnScore`, `MarketBenchmark`
- **Seed:** `npm run demo:bootstrap` or `npm run db:seed:predictive` — align `DEMO_TENANT_ID` with [`lib/l10n/demo-tenant.ts`](lib/l10n/demo-tenant.ts) (default `default-tenant`)
- **APIs:** [`src/app/api/v1`](src/app/api/v1) — `analytics/churn`, `analytics/skills/match`, `analytics/benchmarks`, `ml/churn/score`
- **Python:** [`services/pipelines/train_churn.py`](services/pipelines/train_churn.py); serve with `uvicorn churn_api:app --app-dir services/ml-serving --port 8090`; ETL [`services/pipelines/etl_features.py`](services/pipelines/etl_features.py)
- **Privacy:** [`docs/anonymization.md`](docs/anonymization.md)

---

## Releases & container publishing

- **Versioning:** Use [Conventional Commits](https://www.conventionalcommits.org/) on PRs merged to **`main`** / **`master`**. [`.github/workflows/semantic-release.yml`](.github/workflows/semantic-release.yml) runs **semantic-release**, updates [`package.json`](package.json), [`package-lock.json`](package-lock.json), and [`CHANGELOG.md`](CHANGELOG.md), pushes a **`chore(release): … [skip ci]`** commit, creates **`v*`** tags, and publishes a **GitHub Release** (retry via **workflow_dispatch** if needed).
- **Docker:** Root [`Dockerfile`](Dockerfile) — [ADR `0003`](specs/alignment/decisions/0003-container-supply-chain.md) (distroless runtime, multi-arch). Local Compose overlay: [`docker/README.md`](docker/README.md), [`docker/compose.app.yml`](docker/compose.app.yml).
- **GHCR:** A **published GitHub Release** triggers [`.github/workflows/publish-ghcr.yml`](.github/workflows/publish-ghcr.yml): multi-arch **`linux/amd64`** and **`linux/arm64`**, **SBOM**, **provenance**, push to `ghcr.io/<lowercased-owner>/<lowercased-repo>:<semver>` and **`:latest`**, **Cosign** signature on the digest. Ad hoc builds: workflow **manual dispatch** with a scratch tag.

**Verify a pulled image** (replace `OWNER`, `REPO`, `DIGEST`):

```bash
cosign verify "ghcr.io/OWNER/REPO@sha256:DIGEST" \
  --certificate-identity-regexp '^https://github.com/OWNER/REPO/\.github/workflows/publish-ghcr\.yml@.*' \
  --certificate-oidc-issuer-regexp '^https://token.actions.githubusercontent.com$'
```

**Local image smoke:**

```bash
docker build -t hr-erp:local .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL='postgresql://user:pass@host:5432/db?sslmode=require' \
  -e JWT_SECRET='replace-with-production-secret-at-least-32-chars' \
  hr-erp:local
```

---

## Contributing

Issues and PRs are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md), [`SECURITY.md`](SECURITY.md), and [`docs/community/README.md`](docs/community/README.md). Branch protection and CI expectations: [`docs/community/github-branch-protection.md`](docs/community/github-branch-protection.md).

By contributing, you agree your contributions are licensed under the **Apache License 2.0**, the same license as the project (see [`LICENSE`](LICENSE)), unless you state otherwise.

---

## Third-party software

This application depends on many open-source packages. **Each dependency has its own license.** For an aggregate view, use your toolchain (for example `npm ls` and package metadata, or your organization’s SBOM process). **Product and company names** (e.g. Next.js, PostgreSQL, Redis) may be trademarks of their respective owners; this README does not imply affiliation.

---

## License

Copyright 2026 HR ERP contributors.

Licensed under the **Apache License, Version 2.0**. See the full legal text in **[`LICENSE`](LICENSE)** and attribution notes in **[`NOTICE`](NOTICE)**.

`SPDX-License-Identifier: Apache-2.0`
