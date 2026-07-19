#!/usr/bin/env bash
# Definition of Done — mirrors reusable-ci.yml `web` job (no Postgres / Playwright).
# Full e2e parity: provision DATABASE_URL + run `npm run demo:bootstrap -- --skip-holiday`
# then `npm run test:e2e` (see docs/QA.md).
# Core HR (R-013/R-014): after web parity, nested Postgres suite runs against the
# HR ERP app DATABASE_URL (pre-clear) or HR_ERP_VERIFY_DATABASE_URL. Do not use
# CORE_HR_DATABASE_URL — that name is reserved for the optional extraction DSN
# (services/core-hr), not this slice. Empty-URL web parity alone does not close
# Core HR CRUD evidence.
#
# corp-harness evidence: child env is stripped and RLIMIT_FSIZE is capped — skip
# npm ci when node_modules exists under CORP_HARNESS_ALLOWED_HOST, and resolve
# the suite DSN from .env DATABASE_URL when not present in the environment.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export JWT_SECRET="${JWT_SECRET:-ci-local-jwt-secret-change-me-32chars-minimum-xx}"

read_dotenv_database_url() {
  local env_file="$ROOT/.env"
  if [[ ! -f "$env_file" ]]; then
    return 0
  fi
  local line
  line="$(grep -E '^[[:space:]]*DATABASE_URL=' "$env_file" | head -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 0
  fi
  line="${line#DATABASE_URL=}"
  line="${line#\"}"
  line="${line%\"}"
  line="${line#\'}"
  line="${line%\'}"
  # Refuse extraction DSN accidentally labeled DATABASE_URL.
  if [[ "$line" == *":5433/"* ]] || [[ "$line" == */core_hr\?* ]] || [[ "$line" == */core_hr ]]; then
    return 0
  fi
  printf '%s' "$line"
}

# Preserve app DSN for nested Core HR proof before CI/web-parity clear.
CORE_HR_SUITE_DSN="${HR_ERP_VERIFY_DATABASE_URL:-${DATABASE_URL:-}}"
if [[ -z "${CORE_HR_SUITE_DSN}" ]]; then
  CORE_HR_SUITE_DSN="$(read_dotenv_database_url || true)"
fi
# Match CI `web` job (no Postgres): empty DATABASE_URL so dotenv cannot enable
# integration suites that would ECONNREFUSED against a local .env DSN.
export DATABASE_URL=""

if [[ -x ./scripts/check-stub-canary.sh ]]; then
  ./scripts/check-stub-canary.sh
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  corepack prepare npm@10.9.2 --activate >/dev/null 2>&1 || true
fi

if [[ -n "${CORP_HARNESS_ALLOWED_HOST:-}" && -d node_modules ]]; then
  echo "==> npm ci skipped (corp-harness evidence + existing node_modules)"
else
  echo "==> npm ci (expect packageManager npm@10.9.2)"
  npm ci
fi

echo "==> lint + typecheck"
npm run lint
npm run typecheck

echo "==> security + governance"
npm run security:scan
npm run governance:production-safety
npm audit --audit-level=high
npm run governance:ci

echo "==> contracts + boundaries"
npm run contracts:drift
npm run check:route-policies
npm run check:lib-boundaries

echo "==> prisma + build + unit tests"
npx prisma validate
npx prisma generate
npm run build
npm run test
npm run test:ui
npm run test:payroll

if [[ -n "${CORE_HR_SUITE_DSN}" ]]; then
  echo "==> Core HR Postgres suite (nested; R-013/R-014)"
  DATABASE_URL="${CORE_HR_SUITE_DSN}" JWT_SECRET="${JWT_SECRET}" npx tsx scripts/core-hr-postgres-suite.ts
else
  echo "verify: Core HR Postgres suite skipped (no HR_ERP_VERIFY_DATABASE_URL / pre-clear DATABASE_URL / .env DATABASE_URL); R-013 not claimed by this run"
fi

echo "verify: ok (ci/web parity; intentional omissions vs Actions: gitleaks, protect-mcp, publish-check, python-pipelines, integration/e2e — see docs/QA.md)"
