#!/usr/bin/env bash
# Definition of Done — mirrors reusable-ci.yml `web` job (no Postgres / Playwright).
# Full e2e parity: provision DATABASE_URL + run `npm run demo:bootstrap -- --skip-holiday`
# then `npm run test:e2e` (see docs/QA.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export JWT_SECRET="${JWT_SECRET:-ci-local-jwt-secret-change-me-32chars-minimum-xx}"
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

echo "==> npm ci (expect packageManager npm@10.9.2)"
npm ci

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

echo "verify: ok (ci/web parity; intentional omissions vs Actions: gitleaks, protect-mcp, publish-check, python-pipelines, integration/e2e — see docs/QA.md)"
