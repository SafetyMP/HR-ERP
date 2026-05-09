#!/usr/bin/env bash
# Echo-only helper for on-call operators. Does not mutate Vercel, GitHub, or databases.
set -euo pipefail

cat <<'EOF'
Production rollback (summary)
=============================

Phase A — App traffic (fast)
----------------------------
  1) Vercel → Deployments → Instant Rollback to last good Production deployment, OR:
     npx vercel@latest rollback <prior-deployment-url> --token "$VERCEL_TOKEN" --yes
  2) Optionally smoke: curl PUBLIC_DEPLOY_URL (repo variable, see deploy.yml)

Phase B — Database (only when schema/data broken)
-------------------------------------------------
  1) Stop deploy automation (hold production Environment / block merges).
  2) PITR or snapshot restore via Neon/RDS playbook — no migrate down.
  3) Verify read-only smoke on restored endpoint; cut over DATABASE_URL in Vercel.
  4) prisma migrate deploy from trusted runner if needed — do not rewind history arbitrarily.

Docs: docs/operations/production-rollback-runbook.md
EOF
