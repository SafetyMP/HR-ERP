#!/usr/bin/env bash
# Shell-friendly reminder for CI / local failures — paste output into PR with FAILURE_SUMMARY block.
set -euo pipefail
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "QA failure envelope (paste into PR/issue — full template: docs/QA.md)"
echo "VITEST_SEED=${VITEST_SEED:-unset}"
echo "GITHUB_RUN_ID=${GITHUB_RUN_ID:-unset}"
echo "FAILURE_SUMMARY: <fill: one-line invariant>"
echo "REPRO: <fill: npm run test:unit -- --run ...>"
echo "See docs/QA.md for INPUT_ARTIFACTS, EXPECTED, OBSERVED, ..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
