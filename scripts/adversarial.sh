#!/usr/bin/env bash
# Authorized local adversarial probes (corp-site gate).
# Hermetic platform probes + Core HR domain negatives (R-015).
# When app DATABASE_URL (or HR_ERP_VERIFY_DATABASE_URL) is set, also runs the
# Postgres-backed Core HR adversarial suite. Does not use CORE_HR_DATABASE_URL
# (extraction DSN).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npx tsx scripts/adversarial-probes.ts

SUITE_DSN="${HR_ERP_VERIFY_DATABASE_URL:-${DATABASE_URL:-}}"
if [[ -z "${SUITE_DSN}" && -f "$ROOT/.env" ]]; then
  line="$(grep -E '^[[:space:]]*DATABASE_URL=' "$ROOT/.env" | head -n 1 || true)"
  if [[ -n "$line" ]]; then
    line="${line#DATABASE_URL=}"
    line="${line#\"}"; line="${line%\"}"
    line="${line#\'}"; line="${line%\'}"
    if [[ "$line" != *":5433/"* && "$line" != */core_hr && "$line" != */core_hr\?* ]]; then
      SUITE_DSN="$line"
    fi
  fi
fi
if [[ -n "${SUITE_DSN}" ]]; then
  echo "==> Core HR adversarial suite (Postgres domain negatives)"
  DATABASE_URL="${SUITE_DSN}" \
    JWT_SECRET="${JWT_SECRET:-ci-local-jwt-secret-change-me-32chars-minimum-xx}" \
    npx tsx scripts/core-hr-adversarial-suite.ts
else
  echo "adversarial: Core HR Postgres domain suite skipped (no DATABASE_URL); hermetic Core HR probes still ran"
fi
