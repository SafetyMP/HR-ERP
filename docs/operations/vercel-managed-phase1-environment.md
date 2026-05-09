# Vercel + managed data plane — Phase 1 environment contract

Phase 1 topology is **one Next.js deployable** and **one PostgreSQL** per [ADR-0001](../../specs/alignment/decisions/0001-phase1-scope.md). Local optional services (Redis, Kafka, extra DBs) live in [docker-compose.yml](../../docker-compose.yml) only — do not point production at Docker Compose defaults.

## Vercel project

- **Production deploys are owned by Vercel's git integration.** Push to `main` → Vercel builds with the dashboard env → Vercel deploys. There is **no GitHub Actions deploy job** any more — see the RCA below for why the previous `promote-production --prebuilt` path was removed.
- Runtime config in repo: [`vercel.json`](../../vercel.json) (regions, baseline security headers). Environment-specific values (secrets, URLs, feature flags) live in the Vercel dashboard, not in repo files.
- [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) now runs **CI + QA only** on every push to `main`/`master`; it does not invoke `vercel build` or `vercel deploy`.
- **Churn ML API:** The Next app proxies to **`ML_SERVING_URL`** ([`POST /api/v1/ml/churn/score`](../../src/app/api/v1/ml/churn/score/route.ts)). Co-deploying the Python FastAPI service via Vercel `experimentalServices` previously caused intermittent **“Deploying outputs…”** failures after successful `next build`; production should set **`ML_SERVING_URL`** to a reachable FastAPI base URL (separate host, container, or `vercel dev` locally) if you need churn scoring in cloud.

## Required application secrets (production / preview)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon (or compatible) Postgres connection string with **SSL**; pooled URL recommended for serverless (`?pgbouncer=` / `neon` pooler if applicable). |
| `JWT_SECRET` | HS256 secret for API JWTs (min 16 chars after trim; enforced by `requireJwtSecret` in [`lib/security/jwt.ts`](../../lib/security/jwt.ts)). Set on **all three** Vercel targets — Production, Preview, Development — as type **`encrypted`** (the standard type, available at both build and runtime). Do **not** use type `sensitive`: the previous outage was caused by a `sensitive` entry whose value was empty, which `vercel pull` then materialized as `JWT_SECRET=""` and which `next build` baked into the deployed function. There is no longer a GitHub Actions copy of this secret to keep in sync. |
| `DIRECT_URL` | Optional: direct (non-pooled) URL for Prisma migrations if your host requires it. |

### JWT / bearer troubleshooting

- **Sanity check (local):** `vercel env run -e production -- node -e "require('crypto').createHash('sha256').update(process.env.JWT_SECRET||'').digest('hex')"` should match `node -e "require('crypto').createHash('sha256').update(require('fs').readFileSync('.env','utf8').match(/^JWT_SECRET=\"?([^\"\n]*)/m)[1]).digest('hex')"`. If they differ, the dashboard value and the local signing value are misaligned.
- Tokens from `npm run jwt:dev` / `npm run jwt:dev:vercel` validate on Vercel when **`JWT_SECRET`** at runtime matches the signing secret. Middleware does **not** verify signatures (only Bearer presence); routes verify with `process.env.JWT_SECRET` read at request time inside Node-runtime route handlers ([`lib/security/jwt.ts`](../../lib/security/jwt.ts)).
- On `invalid_token`, the Node function logs `{"msg":"jwt_verify_failed","jose_error_name":...}` to `vercel logs` ([`lib/security/request-auth.ts`](../../lib/security/request-auth.ts)). Look for `JWSSignatureVerificationFailed` (secret mismatch), `JWTExpired` (clock/lifetime), or `JWTClaimValidationFailed` (claim shape) before guessing.
- **Single source of truth:** `JWT_SECRET` lives **only** in the Vercel dashboard (Production + Preview + Development, all `encrypted`). Local `.env` should mirror Production for development tokens. There is no GitHub Actions copy any more.

### Root cause analysis — May 2026 `invalid_token` loop

Five iterative fixes failed to repair the production JWT verifier because every prior round patched a downstream symptom while the dashboard `JWT_SECRET` for Production was literally empty (length 0, type `sensitive`). The chain:

1. The Vercel dashboard `JWT_SECRET` on Production was created as type `sensitive` with no value (length 0). `sensitive` env vars are not exposed at build time and the Vercel API decrypts to empty.
2. `vercel pull --environment=production` (used by the now-deleted GitHub Actions `promote-production` job) wrote `JWT_SECRET=""` (literal empty quotes) into `.vercel/.env.production.local`.
3. `next build` with `output: "standalone"` (previously set in [`next.config.ts`](../../next.config.ts)) read that file and baked `JWT_SECRET=""` into `.next/standalone/.env`. Vercel's git auto-deploy hit the same path because the dashboard value was empty regardless of the deploy mechanism.
4. At runtime, the standalone `.env` was loaded **before** Vercel's runtime env injection, so `process.env.JWT_SECRET` resolved to the literal 2-character string `""`.
5. `jose` then threw `JWSSignatureVerificationFailed` for every valid token. The bundler-evasion code in [`lib/security/jwt.ts`](../../lib/security/jwt.ts) (`await import("node:process")` + array-joined env key) made the failure look like a Webpack inlining bug, sending five remediation rounds chasing a phantom.

The fix removed three things at once so the failure mode cannot recur: `output: "standalone"` (so nothing is baked), the `sensitive` type and empty value (replaced with one `encrypted` entry on all three targets), and the `promote-production` GitHub Actions job (so `vercel pull` is no longer in the deploy path). Permanent observability for the next regression: the structured `jwt_verify_failed` log added to [`lib/security/request-auth.ts`](../../lib/security/request-auth.ts).

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

[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) runs the same reusable `ci` and `qa` workflows on every push to `main` / `master`. It does **not** deploy. Production deployment is performed by Vercel's git integration on the same push.

If a future change reintroduces a GitHub-built deploy artifact, do **not** combine `vercel pull --environment=production` with `vercel deploy --prebuilt` — that combination is what created the May 2026 `invalid_token` outage (see RCA above). Acceptable alternatives:

- Trigger Vercel's own build via `vercel deploy --prod` (no `--prebuilt`) so Vercel's runtime env wins.
- Migrate to a Vercel Marketplace auth provider (Clerk / WorkOS / Auth0) so there is no `JWT_SECRET` to deploy at all.
- Move to RS256 + a JWKS endpoint so the verifier reads a public key at runtime and there is no shared secret across environments.

## Compliance note

Production DB roles must follow [docs/security/stack-decision.md](../security/stack-decision.md) (non-superuser app role, RLS expectations). This document does not replace Security review or `security-review.md` on the PR.
