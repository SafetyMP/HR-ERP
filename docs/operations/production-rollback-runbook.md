# Production rollback runbook (Vercel + Postgres)

Use this when production is **unhealthy after a deploy** or **a bad migration slipped through** despite gates. This runbook is procedural; record **who** approved each step in the incident channel.

## Preconditions

- You have access to **Vercel** (project admin) and **Postgres** provider (e.g. Neon console) with credentials that can restore or branch.
- You know the **Git SHA** (or Vercel deployment id) of the last known-good release.
- Forward-only Prisma migrations remain policy: **never** `migrate down` in production; use **PITR / branch restore** for data regressions (Architecture: forward-only DDL in code reviews).

---

## Phase A — Traffic (immediate, minutes)

Goal: Route users away from broken **application code** immediately.

### A1. Instant rollback on Vercel

Primary prevention: configure the **Ignored Build Step** (`node scripts/vercel-ignored-build.mjs`) so Production does not build until GitHub Quality gate checks succeed — see [`vercel-managed-phase1-environment.md`](./vercel-managed-phase1-environment.md). Instant Rollback remains the secondary abort when a bad SHA still reaches Production.

1. Open Vercel → Project → Deployments → select the prior **Production** deployment.
2. Choose **Instant Rollback** (or equivalent “Promote to Production” the previous deployment).
3. Optionally use CLI after `VERCEL_TOKEN` / org / project are configured locally:

```bash
npx vercel@latest rollback <prior-deployment-url> --token "$VERCEL_TOKEN" --yes
```

4. Verify with `curl` / browser against your production URL and repository variable `PUBLIC_DEPLOY_URL` (post-deploy smoke in `.github/workflows/deploy.yml`).

### A2. Feature flags

If the incident is tied to a **feature flag** or env toggle (not code), flip the flag in Vercel Environment Variables and redeploy **or** wait for the next safe promote — document which path you used.

---

## Phase B — Database (only if schema/data is wrong)

Goal: Restore **consistency** when app rollback alone is insufficient (bad migration, data corruption).

### B1. Stop the bleeding

1. **Pause** automated deploys: disable `Deploy production` workflow or block merges; hold the `production` GitHub Environment.
2. Confirm whether the bad change was **DDL only**, **data only**, or **both**.

### B2. Point-in-time restore (preferred when provider supports it)

Examples: **Neon PITR**, RDS snapshot restore — follow your vendor’s playbook:

1. Create a restored instance or branch at a timestamp **before** the incident.
2. Run application smoke queries **read-only** against the restore candidate.
3. Cut over `DATABASE_URL` (and optional `DIRECT_URL` for migrations) in Vercel to the restored endpoint during a declared maintenance window **or** use provider-specific promote/attach flow.
4. After cutover: run **`npx prisma migrate deploy`** once against the restored database from a trusted CI image or bastion — confirm applied migrations align with expected schema revision (do not arbitrarily rewrite `_prisma_migrations`).

### B3. If PITR is not available

- Restore from latest **validated backup snapshot** plus acceptable RPO loss.
- Open an ADR or incident action item for PITR enablement before next big schema change.

### B4. Post-restore verification

1. Replay read-only acceptance checks (golden queries, critical API GETs).
2. Re-enable deploy pipeline only after **QA + SecOps** sign **post-incident readiness** per your roster.

---

## Phase C — Communications

1. Incident commander posts status + ETA.
2. Link this runbook section and **the exact SHA** rolled back / DB restore time used.
3. File a short **post-incident summary** referencing root cause, detection gap, and follow-ups.

---

## Helper script (terminal reminder)

```bash
bash scripts/print-production-rollback-steps.sh
```

---

## References

- Environment contract: [`vercel-managed-phase1-environment.md`](./vercel-managed-phase1-environment.md)
- Automated promote path: [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)
