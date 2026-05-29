# Documentation index — HR ERP

Start here to navigate human-written docs. Cursor agent orchestration and skills live under [`.cursor/`](../.cursor/).

## Legal / licensing

| Resource | Purpose |
| --- | --- |
| [../LICENSE](../LICENSE) | Apache License, Version 2.0 (full terms). |
| [../NOTICE](../NOTICE) | Copyright and SPDX identifier; satisfies Apache 2.0 NOTICE expectations where applicable. |
| [../package.json](../package.json) | Root package metadata (`license`: `Apache-2.0`). |
| [../CHANGELOG.md](../CHANGELOG.md) | Release notes (semantic-release). |

Dependency packages carry **their own licenses** — use npm or your SBOM tooling for a complete third-party license list.

## New contributors

| Doc | Purpose |
| --- | --- |
| [../README.md](../README.md) | Project overview, quick start, scripts, containers, license |
| [../AGENTS.md](../AGENTS.md) | Agent orchestration, skills, merge posture |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Local environment, databases, workers, troubleshooting |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Branches, PR bar, synthetic data, migration rules |
| [community/README.md](./community/README.md) | External contributors, bug → Orchestrator handoffs |
| [QA.md](./QA.md) | Test layers, fixtures, `FAILURE_SUMMARY` for CI failures |

## Architecture and alignment

| Doc | Purpose |
| --- | --- |
| [architecture/README.md](./architecture/README.md) | Bounded contexts, module proposals, where ADRs live |
| [architecture/bounded-contexts.md](./architecture/bounded-contexts.md) | Service map and ownership |
| [architecture/database-migrations-and-state.md](./architecture/database-migrations-and-state.md) | Prisma + per-context SQL migrations, RLS, verification |
| [../specs/alignment/README.md](../specs/alignment/README.md) | Phase ADRs and decision process |
| [../contracts/README.md](../contracts/README.md) | OpenAPI + Protobuf (Buf) layout and lint commands |

## Security and compliance

| Doc | Purpose |
| --- | --- |
| [security/stack-decision.md](./security/stack-decision.md) | Platform and crypto posture |
| [security/policy-catalog.md](./security/policy-catalog.md) | RBAC/ABAC expectations |
| [security/rls-session-contract.md](./security/rls-session-contract.md) | Postgres session GUCs for RLS |
| [compliance/README.md](./compliance/README.md) | Wage/hour rule packs and jurisdiction matrix (v1 scope) |

## AI / ML

| Doc | Purpose |
| --- | --- |
| [ai-governance/README.md](./ai-governance/README.md) | HITL, XAI, minimization, model cards |
| [ml/README.md](./ml/README.md) | Prediction logging, drift, rollout sequence |
| [anonymization.md](./anonymization.md) | Privacy notes for analytics features |

## Product

| Doc | Purpose |
| --- | --- |
| [product/stakeholder-value-plan.md](./product/stakeholder-value-plan.md) | **Single active forward plan** — truth baseline, W1–W7, P0–P3 priorities |
| [product/reference-customer-exit-runbook.md](./product/reference-customer-exit-runbook.md) | Phase B exit checklist for reference customers |
| [product/hr-product-owner-operating-model.md](./product/hr-product-owner-operating-model.md) | How Feature briefs and UAC work |
| [product/feature-brief-template.md](./product/feature-brief-template.md) | Template for shippable capabilities |
| [product/codebase-completion-baseline.md](./product/codebase-completion-baseline.md) | Completion measurement (tracks A/B/C); section 2c platform inventory + diagram; section 2d skills gap lens; Feature 001 backlog / audit sections |
| [product/competitive-benchmark-executive-brief.md](./product/competitive-benchmark-executive-brief.md) | Multi-segment competitive benchmark (operations lens) — executive summary |
| [product/competitive-ops-tco-worksheet.md](./product/competitive-ops-tco-worksheet.md) | Illustrative operate TCO vs SaaS PEPM by segment |
| [product/competitive-ops-inventory.md](./product/competitive-ops-inventory.md) | Validated production/CI/worker inventory for benchmark |
| [../specs/competitive-analysis-roadmap.md](../specs/competitive-analysis-roadmap.md) | Competitive parity matrix, roadmap tiers, strategic priorities |

## Operations

| Doc | Purpose |
| --- | --- |
| [operations/production-rollback-runbook.md](./operations/production-rollback-runbook.md) | Rollback checklist |
| [operations/phase1-production-checklist.md](./operations/phase1-production-checklist.md) | Phase 1 prod checklist (Vercel, workers, env); run `npm run ops:smoke` / `npm run ops:verify` |
| [operations/vercel-managed-phase1-environment.md](./operations/vercel-managed-phase1-environment.md) | Managed deploy notes |

## UI

| Doc | Purpose |
| --- | --- |
| [../FRONTEND.md](../FRONTEND.md) | React state, a11y, API errors, demo routes |

## Containers

| Resource | Purpose |
| --- | --- |
| [../docker/README.md](../docker/README.md) | GHCR usage, Compose overlay for the Next.js image |
| [../Dockerfile](../Dockerfile) | Production OCI build (distroless final stage) |
| [../specs/alignment/decisions/0003-container-supply-chain.md](../specs/alignment/decisions/0003-container-supply-chain.md) | Supply-chain ADR (SBOM, provenance, Cosign) |
