This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

The repo mixes human contributors and Cursor-orchestrated agents under the rules in [`AGENTS.md`](AGENTS.md).

## Contributing

We welcome issues and PRs from people and from automation alike. Start with **[`CONTRIBUTING.md`](CONTRIBUTING.md)** and **[`docs/community/README.md`](docs/community/README.md)** for branching, synthetic test data expectations, and how bug reports may be converted into Orchestrator-ready JSON handoffs.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Security architecture

Defense-in-depth defaults aligned with the security blueprint:

- **Docs**: [`docs/security/stack-decision.md`](docs/security/stack-decision.md) (stack), [`docs/security/policy-catalog.md`](docs/security/policy-catalog.md) (RBAC/ABAC), [`docs/security/rls-session-contract.md`](docs/security/rls-session-contract.md) (Postgres `SET LOCAL` + RLS), [`docs/security/tls-and-data-at-rest.md`](docs/security/tls-and-data-at-rest.md) (TLS 1.3 + AES-256-GCM).
- **Runtime**: JWT verified in [`middleware.ts`](middleware.ts) for `/api/v1/*`; handlers use [`lib/security/with-authorized-transaction.ts`](lib/security/with-authorized-transaction.ts) so tenant GUCs are set before queries.
- **CI**: [`npm run security:scan`](scripts/security-scan.mjs) plus ESLint bans on `$executeRawUnsafe` / `$queryRawUnsafe` (see [`eslint.config.mjs`](eslint.config.mjs)).
- **Dev tokens**: `node scripts/issue-dev-jwt.mjs` (requires `JWT_SECRET` in `.env`).

## Predictive HR (churn, skills, benchmarks)

- **Schema**: Prisma models in [`prisma/schema.prisma`](prisma/schema.prisma) (`Department`, `JobRole`, `ChurnScore`, `MarketBenchmark`, …) with migration [`prisma/migrations/20260509140000_predictive_hr_analytics`](prisma/migrations/20260509140000_predictive_hr_analytics/migration.sql).
- **Seed**: `npm run db:seed:predictive` → set `DEMO_TENANT_ID` + `ANALYTICS_DEMO_MODE=1` for demo dashboards under [`/analytics`](src/app/analytics).
- **APIs**: `GET/POST` under [`src/app/api/v1`](src/app/api/v1) (`analytics/churn`, `analytics/skills/match`, `analytics/benchmarks`, `ml/churn/score`).
- **Python**: train `services/pipelines/train_churn.py`; serve with `uvicorn churn_api:app --app-dir services/ml-serving --port 8090`; ETL [`services/pipelines/etl_features.py`](services/pipelines/etl_features.py).
- **Privacy**: [`docs/anonymization.md`](docs/anonymization.md).

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
