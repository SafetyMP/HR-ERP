#!/usr/bin/env bash
# Integration E2E — mirrors reusable-qa Playwright job (requires DATABASE_URL + seed).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export JWT_SECRET="${JWT_SECRET:-ci-local-jwt-secret-change-me-32chars-minimum-xx}"
npm run demo:bootstrap -- --skip-holiday
npm run test:e2e
