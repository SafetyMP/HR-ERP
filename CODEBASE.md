# Codebase map — HR ERP

Navigation for the **modular monolith** (Next.js + `lib/` domains + Prisma). Architecture rules: [docs/architecture/](docs/architecture/README.md). Import discipline: [lib-module-boundaries.md](docs/architecture/lib-module-boundaries.md) · `npm run check:lib-boundaries`.

| Path | Index |
| --- | --- |
| [`lib/`](lib/README.md) | Server domain modules, security, Prisma access |
| [`src/`](src/README.md) | App Router UI, client hooks, route handlers |
| [`scripts/`](scripts/README.md) | CLI: DB, demo, governance, workers, QA |
| [`tests/`](tests/README.md) | Vitest + Playwright layout |
| [`packages/payroll-calc/`](packages/payroll-calc/) | Deterministic payroll kernel (workspace) |
| [`prisma/`](prisma/) | App DB schema and migrations |
| [`services/`](services/) | Python ML + bounded-context SQL (optional) |
| [`workers/`](workers/outbox-publisher/README.md) | Kafka outbox publisher |
| [`contracts/`](contracts/README.md) · [`proto/`](proto/) | REST + gRPC contracts |

**Path aliases** ([`tsconfig.json`](tsconfig.json)): `@/*` → `src/*` · `@/lib/*` → `lib/*` then `src/lib/*` · `@hr-erp/payroll-calc` → payroll kernel.

**Do not commit:** `node_modules/`, `.next/`, `*.tsbuildinfo`, `test-results/`, `.env`, `tests/generated/`.
