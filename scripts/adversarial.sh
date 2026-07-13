#!/usr/bin/env bash
# Tier-3 adversarial oracle — unauthenticated API denies.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE="${ADVERSARIAL_BASE_URL:-http://localhost:3000}"

log() { echo ""; echo "== adversarial: $* =="; }

if ! curl -fsS "$BASE/api/health" >/dev/null 2>&1 && ! curl -fsS "$BASE" >/dev/null 2>&1; then
  echo "App not running at $BASE — start dev server or run integration-e2e bootstrap first" >&2
  exit 1
fi

# deny_case: anonymous_compensation_cycles
log "anonymous_compensation_cycles (expect 401)"
code=$(curl -s -o /tmp/hrerp-adversarial.json -w "%{http_code}" \
  "$BASE/api/v1/compensation/cycles")
[[ "$code" == "401" ]]
grep -qi 'Unauthorized\|unauthorized' /tmp/hrerp-adversarial.json
echo "  ${code} (as expected)"

echo ""
echo "adversarial: ok"
