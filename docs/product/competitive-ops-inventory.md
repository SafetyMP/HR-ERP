# Competitive benchmark — validated operations inventory

**Purpose:** Ground the [operations TCO worksheet](./competitive-ops-tco-worksheet.md) and [executive brief](./competitive-benchmark-executive-brief.md) in **live repo config** (not training defaults).

**Validated:** 2026-05-18 against `vercel.json`, `docker-compose.yml`, `package.json`, `.github/workflows/*`, `.env.example`.

---

## Production topology (Phase 1 — operational truth)

| Component | Source | Production posture |
| --- | --- | --- |
| **App runtime** | [`vercel.json`](../../vercel.json) | Next.js on Vercel; region **`iad1`** only; security headers on all routes |
| **Deploy path** | [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) | **Vercel git integration** deploys `main`; workflow is **CI/QA gate only** (no `vercel deploy --prebuilt` — see RCA in [`docs/operations/vercel-managed-phase1-environment.md`](../operations/vercel-managed-phase1-environment.md)) |
| **Database** | ADR [`0004-modular-monolith-phase1`](../../specs/alignment/decisions/0004-modular-monolith-phase1.md) | Single `DATABASE_URL` (Neon/RDS-class); **not** split Core HR / Payroll in prod |
| **Cache / queue** | [`.env.example`](../../.env.example) `REDIS_URL` | Redis for BullMQ; required when integration/webhook workers run |
| **Background workers** | `package.json` scripts | **`worker:integrations`**, **`worker:webhooks`** — separate Node processes (not Vercel serverless) |
| **Kafka / outbox** | `outbox:kafka`, Compose `architecture` profile | **Deferred** until ADR trigger; local scaffold only |
| **OCI self-host** | [`Dockerfile`](../../Dockerfile), [`publish-ghcr.yml`](../../.github/workflows/publish-ghcr.yml) | Optional distroless image on **release**; not default Phase 1 path |

---

## Local / staging infrastructure

| Profile | Command | Services |
| --- | --- | --- |
| **Default** | `npm run db:up` | Redis **6379**, Postgres **pgvector/pg16** on host **15432** (`hr_erp`) |
| **Architecture** | `npm run db:up:arch` | Above + ZooKeeper, Kafka **9092**, Schema Registry **8081**, `postgres-core-hr` **5433**, `postgres-payroll` **5434** |

**Ops warning:** The `architecture` profile is **Phase 2 target topology** per ADR 0004. Running it in staging without a documented trigger **increases** container count ~5× with **no** production app wiring to secondary DBs or Kafka today.

---

## Worker and integration scripts

| Script | Role | Ops requirement |
| --- | --- | --- |
| `npm run worker:integrations` | BullMQ integration jobs, webhook poll (when configured) | Always-on process + `REDIS_URL` |
| `npm run worker:webhooks` | HTTP webhook delivery drain (ADR 0008 P8) | Always-on; fan-out on enqueue unless `WEBHOOK_FANOUT_ON_ENQUEUE=0` |
| `npm run outbox:kafka` | Kafka publisher | Only when bus adopted |
| `npm run integrations:replay-dlq` | DLQ replay (on-call / ops) | Runbook-driven |

---

## CI/CD inventory (GitHub Actions)

### PR and feature branches (`quality-gate.yml`)

| Job | Workflow | Steps (summary) |
| --- | --- | --- |
| **ci / web** | `reusable-ci.yml` | `npm ci`, lint, `security:scan`, contracts drift, prisma validate/generate, **build**, unit tests |
| **ci / python-pipelines** | `reusable-ci.yml` | Python 3.12 churn smoke — **PR path-filter** to `services/pipelines/**` and `services/ml-serving/**`; runs on all pushes to `main` |
| **qa / vitest-shard** | `reusable-qa.yml` | Matrix **2 shards** of `vitest run` |
| **qa / integration** | `reusable-qa.yml` | Postgres 16 service, `migrate deploy`, `db:verify`, `tests/integration` |
| **qa / e2e** | `reusable-qa.yml` | Playwright chromium, `ci-issue-e2e-jwts.mjs`, `test:e2e` |

Concurrency: `cancel-in-progress: true` on feature branches. `VITEST_SEED` = `github.run_id`.

### `main` / `master` (`deploy.yml`)

Same **ci** + **qa** suites as quality gate (second run on merge — intentional gate before/at Vercel build; see workflow comment on avoiding **triple** billing vs older designs).

### Release / supply chain

| Workflow | Trigger |
| --- | --- |
| `semantic-release.yml` | Version/changelog on main |
| `publish-ghcr.yml` | GitHub Release / manual — multi-arch, SBOM, Cosign |

**Node version:** **22** (matches CI and container ADR).

---

## Application scale signals

| Signal | Value | Source |
| --- | --- | --- |
| Prisma models | **78** | `prisma/schema.prisma` |
| Route policy registry | **~400+ lines** | `lib/security/route-policies.ts` |
| Shipped Feature UAC | **115 / 115** (001–017) | [`codebase-completion-baseline.md`](./codebase-completion-baseline.md) |
| Production checklist | Published | [`phase1-production-checklist.md`](../operations/phase1-production-checklist.md) |

---

## Environment variables (ops-critical)

From [`.env.example`](../../.env.example) — non-exhaustive:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | App SoT Postgres |
| `JWT_SECRET` | HS256 session/API tokens (Vercel Production target) |
| `REDIS_URL` | BullMQ + workers |
| `OIDC_*` | Optional enterprise IdP (when set, OIDC routes active) |
| `WEBHOOK_FANOUT_ON_ENQUEUE` | Default on; set `0` to disable fan-out |
| `WEBHOOK_DELIVERY_POLL_MS` | Webhook worker poll interval |
| `PAYROLL_PREMIUM_FROM_ATTENDANCE` | Premium lines on paystub when `1` (ADR 0006) |
| `ML_SERVING_URL` | Churn proxy default `http://127.0.0.1:8090` |

---

## Inventory vs plan assumptions

| Plan claim | Validated |
| --- | --- |
| Vercel `iad1` | **Yes** — `vercel.json` |
| Heavy layered QA | **Yes** — 2 Vitest shards + integration Postgres + Playwright + Python per gate |
| Workers separate from Vercel | **Yes** — `worker:integrations`, `worker:webhooks` |
| Kafka deferred | **Yes** — Compose profile `architecture`; ADR 0001/0004 |
| Webhooks shipped | **Yes** — ADR 0008; env toggles in `.env.example` |

---

## Related documents

- [Competitive analysis & roadmap](../../specs/competitive-analysis-roadmap.md)
- [Operations TCO worksheet](./competitive-ops-tco-worksheet.md)
- [Executive brief](./competitive-benchmark-executive-brief.md)
- [Phase 1 production checklist](../operations/phase1-production-checklist.md)
- [Vendor connector RFC](../integrations/vendor-connector-rfc.md)
- [Deferred platform track](./deferred-platform-track.md)
