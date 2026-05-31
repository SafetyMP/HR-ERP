# `scripts/` — CLI and automation

Node/TS utilities invoked from `package.json` or CI. Prefer `npm run <script>` over calling files directly so env and flags stay consistent.

## Database and demo

| Script | `npm run` | Purpose |
| --- | --- | --- |
| `bootstrap-local-demo.ts` | `demo:bootstrap` | Migrate + seeds + holidays |
| `seed-predictive-demo.ts` | `db:seed:predictive` | Predictive HR demo rows |
| `seed-phase3-demo.ts` | (via bootstrap) | Phase 3 snapshot slice |
| `db-verify-migration.ts` | `db:verify` | Post-migrate orphan checks |
| `db-push-guard.mjs` | `db:push` | Guarded `db push` |
| `db-load-employee-scenarios.ts` | `db:load:fixtures` | Synthetic employee batches |
| `sync-holidays.ts` | `holiday:sync` | US/JP holiday import |

## Auth and deploy smoke

| Script | `npm run` | Purpose |
| --- | --- | --- |
| `issue-dev-jwt.mjs` | `jwt:dev`, `jwt:dev:demo-*` | HS256 dev tokens |
| `vercel-jwt-smoke.mjs` | `vercel:jwt:smoke` | Production JWT smoke |
| `ops-staging-smoke.mjs` | `ops:smoke` | Staging checklist |
| `production-safety-check.mjs` | (CI) | Dangerous env flags |
| `reference-customer-exit-verify.mjs` | `verify:reference-exit` | Exit artifact lint |

## Workers and integrations

| Script | `npm run` | Purpose |
| --- | --- | --- |
| `integration-workers.ts` | `worker:integrations` | BullMQ integration worker |
| `webhook-delivery-worker.ts` | `worker:webhooks` | Webhook delivery |
| `dlq-replay.ts` | `integrations:replay-dlq` | DLQ replay |
| `backfill-webhook-secret-encryption.ts` | `webhooks:encrypt-secrets` | Secret encryption backfill |

## Governance and quality

| Script | `npm run` | Purpose |
| --- | --- | --- |
| `governance-lint.mjs` | `governance:lint`, `governance:plan`, … | Tier, handoff, team-map |
| `governance-ci` bundle | `governance:ci` | Pre-merge governance gate |
| `governance-learning.mjs` | `governance:learning:*` | Adaptation plane |
| `governance-evidence.mjs` | `governance:evidence` | Evidence bundles |
| `governance-cloud-session.mjs` | `governance:cloud-session` | Cloud session ledger |
| `governance-generate-pr-body.mjs` | `governance:pr-body` | PR body stub |
| `governance-sync-agent-rules.mjs` | (in `governance:ci`) | Agent rules sync check |
| `check-lib-module-boundaries.mjs` | `check:lib-boundaries` | `lib/` import graph |
| `check-route-policy-parity.mjs` | `check:route-policies` | Route ↔ policy parity |
| `check-openapi-drift.mjs` | `contracts:drift` | OpenAPI drift |
| `check-ess-design-tokens.mjs` | `check:ess-design-tokens` | ESS token lint |
| `security-scan.mjs` | `security:scan` | Repo security scan |
| `protect-mcp-shadow-check.mjs` | `governance:protect-mcp` | MCP shadow receipts |

## QA and load

| Script | `npm run` | Purpose |
| --- | --- | --- |
| `qa-generate-fixture-batch.ts` | `qa:fixtures` | Synthetic batch JSON |
| `qa-print-failure-envelope.sh` | `qa:failure-envelope` | CI failure template |
| `load-test-ess-reads.mjs` | `load-test:ess` | ESS read load test |
| `ci-issue-e2e-jwts.mjs` | (CI) | E2E JWT mint for workflows |

## Other

| Script | Purpose |
| --- | --- |
| `copilot-mcp-server.ts` | Copilot MCP stdio server |
| `print-production-rollback-steps.sh` | Rollback helper output |

Full wiring: root [`package.json`](../package.json).
