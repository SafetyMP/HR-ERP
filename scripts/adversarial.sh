#!/usr/bin/env bash
# Authorized local adversarial probes (corp-site gate).
# Hermetic: imports production gates via tsx (no live network attacks).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npx tsx scripts/adversarial-probes.ts
