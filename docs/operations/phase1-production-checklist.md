# Phase 1 production operations checklist

**Purpose:** Minimum operational bar for HR ERP Phase 1 (modular monolith on Vercel + Postgres + Redis workers).  
**Anchors:** ADR [`0001-phase1-scope`](../../specs/alignment/decisions/0001-phase1-scope.md), [`0004-modular-monolith-phase1`](../../specs/alignment/decisions/0004-modular-monolith-phase1.md), [competitive ops inventory](../product/competitive-ops-inventory.md).

---

## 1. Supported deployment pattern (90-day default)

| Layer | Choice |
| --- | --- |
| **Web app** | Vercel git integration → Production deploy on `main` (region `iad1` per [`vercel.json`](../../vercel.json)) |
| **Database** | Single `DATABASE_URL` (Neon, RDS, or equivalent) |
| **Redis** | Managed Redis for BullMQ (`REDIS_URL`) |
| **Background workers** | **Option B (recommended):** small always-on VM or PaaS process host running **both** `npm run worker:webhooks` and `npm run worker:integrations` |

Do **not** run Kafka, Schema Registry, or second Postgres instances in production until an ADR trigger is documented ([`deferred-platform-track.md`](../product/deferred-platform-track.md)).

---

## 2. Environment variables (Production)

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | App system of record |
| `JWT_SECRET` | Yes | Min 32 chars; set only in Vercel dashboard (see [vercel-managed-phase1-environment.md](./vercel-managed-phase1-environment.md)) |
| `REDIS_URL` | Yes (if workers enabled) | BullMQ + integration jobs |
| `INTEGRATION_SECRET_KEY` | Yes | Integration token encryption |
| `WEBHOOK_ENCRYPTION_KEY` | Recommended | Webhook subscription secrets; falls back to `INTEGRATION_SECRET_KEY` if unset |
| `WEBHOOK_FANOUT_ON_ENQUEUE` | Optional | Default on; set `0` to disable fan-out |
| `WEBHOOK_DELIVERY_POLL_MS` | Optional | Default `2000` |
| `OIDC_*` | If using enterprise IdP | See `.env.example` |
| `PAYROLL_PREMIUM_FROM_ATTENDANCE` | Optional | Set `1` to include OT/DT premium lines on pay runs (ADR 0006) |

### OIDC / session (when `OIDC_ISSUER` is set)

| Variable | Purpose |
| --- | --- |
| `OIDC_ISSUER` | IdP issuer URL |
| `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` | OAuth client |
| `OIDC_REDIRECT_URI` | Must match IdP app registration (e.g. `https://<host>/api/auth/oidc/callback`) |
| `SESSION_COOKIE_NAME` | HttpOnly session cookie (default `hr_erp_session`) |

**Verify:** `GET /api/auth/oidc/login` redirects to IdP; callback sets session cookie; employee routes accept cookie without `Authorization` header. Dev-only: `POST /api/auth/dev-bootstrap` must be **disabled** in Production.

### Neon Auth / Google (when `NEON_AUTH_BASE_URL` is set)

| Variable | Purpose |
| --- | --- |
| `NEON_AUTH_BASE_URL` | Neon Auth proxy base (from Neon Console → Auth) |
| `NEON_AUTH_COOKIE_SECRET` | Cookie signing secret (min 32 chars) |
| `AUTH_PUBLIC_ORIGIN` | Optional canonical origin when Vercel aliases differ from `request.url` |

**Trusted origins:** In Neon Console → Auth → Domains, add every Production URL users may visit (e.g. `https://<project>.vercel.app`). The OAuth callback path is `/api/auth/neon/complete` — Better Auth validates the full callback URL against this list. Enable **Allow localhost** for local dev, or add `http://localhost:3000` explicitly.

**Verify:** Sign in from the exact Production hostname; on `Invalid callbackURL`, add `window.location.origin` shown in the error hint to Neon trusted origins.

**Demo sign-in (buyer preview):** Set `ALLOW_DEMO_PREVIEW_SIGNIN=1` and `NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN=true`. Vercel **Preview** deploys (PR branches) pick this up automatically. If the project **only deploys Production** (pushes to `main` with no PR previews), also set `ALLOW_DEMO_PREVIEW_ON_PRODUCTION=1` on the Production environment (Human authorization). One-click personas: `/api/auth/demo-preview?persona=employee|manager|hr`.

---

## 3. Pre-deploy checklist

- [ ] `main` passes CI + QA ([`deploy.yml`](../../.github/workflows/deploy.yml) gate)
- [ ] `npx prisma migrate deploy` applied to production database
- [ ] `npm run db:verify` passes against production (read-only maintenance window)
- [ ] Vercel Production env reviewed (no empty `JWT_SECRET` in build artifacts)
- [ ] Rollback runbook linked: [production-rollback-runbook.md](./production-rollback-runbook.md)

---

## 4. Worker processes (required for webhooks)

Start and supervise on the worker host:

```bash
export DATABASE_URL="..."
export REDIS_URL="..."
export JWT_SECRET="..."   # if workers need auth context for jobs
npm run worker:webhooks
# separate process or supervisor entry:
npm run worker:integrations
```

**Verify:**

1. Redis reachable from worker host.
2. After a domain event with fan-out enabled, `webhook_deliveries` rows move `PENDING` → `SUCCESS` or `RETRY`/`FAILED` with `last_response_code` set.
3. Integration DLQ empty or monitored (`npm run integrations:replay-dlq` documented for on-call).

**Staging smoke (optional):**

```bash
npm run ops:smoke
# full data + env gate:
npm run ops:verify
```

---

## 5. Post-deploy smoke

- [ ] `GET /` loads home hub
- [ ] Employee paystub path works with production IdP or session cookie
- [ ] One authenticated `GET /api/v1/me/profile` returns 200 for test employee
- [ ] Workers running ≥24h without crash loop
- [ ] No PII in application logs (pay amounts, SSN patterns)

---

## 6. Explicitly out of scope for Phase 1 prod

| Item | Action |
| --- | --- |
| `docker compose --profile architecture` | Local/staging research only |
| `npm run outbox:kafka` | Do not run without ADR |
| Second `postgres-core-hr` / `postgres-payroll` URLs | Not wired to app |

---

## 8. SCIM provisioning (Phase C — brief 023)

| Variable | Required | Notes |
| --- | --- | --- |
| `SCIM_TENANT_TOKENS` | If using IdP sync | JSON map `tenantId → { token, previousToken? }` |
| `SCIM_RATE_LIMIT_PER_MINUTE` | Optional | Default `120` per tenant |

**Verify:**

1. `GET /api/scim/v2/ServiceProviderConfig` returns 200 with bearer token.
2. IdP test user creates `Employee` + `UserAccount` row under correct tenant.
3. Cross-tenant user ID returns **404** (not foreign data).
4. Demo routes remain blocked (`ALLOW_DEMO_API_ROUTES` unset in Production).

Runbook: [docs/security/scim.md](../security/scim.md)

---

## 9. Related documents

- [Validated ops inventory](../product/competitive-ops-inventory.md)
- [Executive brief](../product/competitive-benchmark-executive-brief.md)
- [Docker / OCI](../../docker/README.md)
