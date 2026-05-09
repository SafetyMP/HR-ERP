# Vercel + managed data plane — Phase 1 environment contract

Phase 1 topology is **one Next.js deployable** and **one PostgreSQL** per [ADR-0001](../../specs/alignment/decisions/0001-phase1-scope.md). Local optional services (Redis, Kafka, extra DBs) live in [docker-compose.yml](../../docker-compose.yml) only — do not point production at Docker Compose defaults.

## Vercel project

- Link the GitHub repo in Vercel (or deploy via [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) using `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
- Runtime config in repo: [`vercel.json`](../../vercel.json) (regions, baseline security headers). Prefer environment-specific overrides in the Vercel dashboard for preview vs production.
- **Churn ML API:** The Next app proxies to **`ML_SERVING_URL`** ([`POST /api/v1/ml/churn/score`](../../src/app/api/v1/ml/churn/score/route.ts)). Co-deploying the Python FastAPI service via Vercel `experimentalServices` previously caused intermittent **“Deploying outputs…”** failures after successful `next build`; production should set **`ML_SERVING_URL`** to a reachable FastAPI base URL (separate host, container, or `vercel dev` locally) if you need churn scoring in cloud.

## Required application secrets (production / preview)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon (or compatible) Postgres connection string with **SSL**; pooled URL recommended for serverless (`?pgbouncer=` / `neon` pooler if applicable). |
| `JWT_SECRET` | HS256 secret for API JWTs (min length enforced by app; rotate via controlled release). **`/api/v1/*` verification runs in Node route handlers** (`requireBearerAuth`), which read this at **runtime** so minted tokens match Vercel without Edge build-time drift. For **[prebuilt production deploys](../../.github/workflows/deploy.yml)** from GitHub Actions, add **`JWT_SECRET`** to the GitHub **production** Environment secrets with the **same** value as Vercel Production — `vercel pull` in CI often does not supply decrypted env to `vercel build`. Never use a placeholder secret in CI. |
| `DIRECT_URL` | Optional: direct (non-pooled) URL for Prisma migrations if your host requires it. |

### JWT / bearer troubleshooting

- **Sanity check (local):** `vercel env run -e production -- node -e "require('crypto').createHash('sha256').update(process.env.JWT_SECRET||'').digest('hex')"` should match the same hash from loading `.env` only — if they differ, dashboard vs local signing are misaligned before you chase deploy issues.
- Tokens from `npm run jwt:dev` / `npm run jwt:dev:vercel` validate on Vercel when **`JWT_SECRET`** for **runtime** (dashboard / Functions) matches the signing secret. Middleware does **not** verify signatures (only Bearer presence); routes verify with **runtime** `JWT_SECRET` loaded via **`node:process`** in code so it is not baked in at `next build`.
- If **Node** handlers still return `invalid_token`, runtime `JWT_SECRET` in that environment is wrong or empty — fix dashboard (or GitHub env for the promote path), redeploy, and confirm the variable is available to **Serverless / Node**, not only build-only overrides.
- **Copy/paste hygiene:** When setting `JWT_SECRET` in **Vercel** and **GitHub** (production Environment), avoid **trailing spaces or newlines**—they cause signature mismatches or, in CI, can confuse `vercel build`. Prefer a single-line value (e.g. `openssl rand -hex 32`). The deploy workflow **strips** leading/trailing whitespace from the GitHub secret before build.
- **Git vs GitHub Actions deploy:** Pushes build on **Vercel** using **dashboard** env. The **promote-production** job builds on **GitHub** and needs **`JWT_SECRET` in the GitHub `production` Environment** so the prebuilt Edge bundle gets the real secret. Keep both values **identical** when using both paths.

## Redis / BullMQ (optional in Phase 1)

If workers or BullMQ are enabled in an environment, set a managed Redis URL (e.g. Upstash) as `REDIS_URL` (or the name your code expects — align with `lib/` queue bootstrap). **Do not** use `docker-compose` Redis hostnames in cloud.

## Observability (OpenTelemetry)

| Variable | Purpose |
|----------|---------|
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | OTLP HTTP URL for traces (**takes precedence** over the generic endpoint when both are set). |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Generic OTLP HTTP base URL for traces when the traces-specific variable is unset. When both are unset (and `OTEL_ENABLED` is not `true`), the Node SDK in [`instrumentation.ts`](../../instrumentation.ts) does not start. |
| `OTEL_EXPORTER_OTLP_HEADERS` | Semicolon-separated `key=value` pairs for vendor auth (set in Vercel; never commit secrets). |
| `OTEL_SERVICE_NAME` | Service name in trace resource (default `hr-erp` if unset when the SDK starts). |
| `OTEL_ENABLED` | Set to `true` to force SDK load when configuration is exporter-only via OTEL standard env vars. |

**Local / CI `next build`:** the instrumentation hook **skips exporting** during the production build phase (`NEXT_PHASE` / argv heuristic) so OTLP I/O does not run while prerendering.

**Datadog:** use Datadog’s documented OTLP trace intake URL and authentication headers per their Next.js / OTLP guide — store values in Vercel Environment Variables only.

## Incident response

- Application + database rollback playbook: [`production-rollback-runbook.md`](./production-rollback-runbook.md)

## GitHub Actions / deploy

- Configure the **`production`** GitHub Environment with **required reviewers** (QA + SecOps owners).
- Optional repository variable `PUBLIC_DEPLOY_URL` — enables the post-deploy smoke `curl` in [`deploy.yml`](../../.github/workflows/deploy.yml).

### Authentication: `VERCEL_TOKEN` today, OIDC roadmap

- **Current path (required):** GitHub Actions invokes the Vercel CLI with `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` scoped to the **`production`** Environment (or repo-level secrets with least privilege).
- **Operational hygiene:** Rotate `VERCEL_TOKEN` on a predictable cadence *or* when staffing changes; never reuse personal tokens for CI—provision a **scoped automation token** with deploy rights to a single project/folder.
- **OIDC / tokenless posture:** GitHub↔Vercel “trusted publishing” is still maturing in the ecosystem. When Vercel documents a first-class GitHub Actions federation flow for your linking model, add `permissions.id-token: write` to the promote job, remove vault-stored `VERCEL_TOKEN`, and update this section with the exact federation steps. Until then, treat `VERCEL_TOKEN` as legacy-but-required and keep it out of logs.

## Compliance note

Production DB roles must follow [docs/security/stack-decision.md](../security/stack-decision.md) (non-superuser app role, RLS expectations). This document does not replace Security review or `security-review.md` on the PR.
