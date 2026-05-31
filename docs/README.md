# Documentation index — HR ERP

Start here to navigate human-written docs. Cursor agent orchestration and skills live under [`.cursor/`](../.cursor/).

**Product status (quick map):** Track A **001–022** = **155/155 UAC** met → Phase C **023–025** met → Track B (reference exit, ESS friction, counsel) — [stakeholder-value-plan.md](./product/stakeholder-value-plan.md).

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

## Meta / agent orchestration

| Doc | Purpose |
| --- | --- |
| [meta/agent-team-map.md](./meta/agent-team-map.md) | Team roster, lanes, skills |
| [meta/cursor-3-native-runtime.md](./meta/cursor-3-native-runtime.md) | Cursor 3 operator loop (`governance:lint`, `/multitask`, `/worktree`) |
| [../specs/templates/collaboration-plan.md](../specs/templates/collaboration-plan.md) | Harness HITL collaboration phases (ADR 0020) |

## Code navigation

| Resource | Purpose |
| --- | --- |
| [../CODEBASE.md](../CODEBASE.md) | Repo-wide map: `lib/`, `src/`, `scripts/`, `tests/` |
| [../lib/README.md](../lib/README.md) | Server module folders and boundaries |
| [../src/README.md](../src/README.md) | App Router segments and conventions |

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

### Forward plan and buyer-ready (Track B)

| Doc | Purpose |
| --- | --- |
| [product/stakeholder-value-plan.md](./product/stakeholder-value-plan.md) | **Single active forward plan** — W1–W7, P0–P3, briefs 023–028 status |
| [product/reference-customer-exit-runbook.md](./product/reference-customer-exit-runbook.md) | Reference customer exit checklist (`/employee`, payroll, integrations) |
| [product/reference-customer-exit-pilot-checklist.md](./product/reference-customer-exit-pilot-checklist.md) | Pilot gate before signed exit appendix |
| [product/ess-friction-scorecard.md](./product/ess-friction-scorecard.md) | ESS task budgets + Playwright friction specs (**required** exit gate) |
| [product/counsel-track-w3-w7.md](./product/counsel-track-w3-w7.md) | W3 withholding + W7 COBRA counsel gates |
| [product/deferred-platform-track.md](./product/deferred-platform-track.md) | Track D quarantine, demo routes, briefs 026–029 backlog |

### PO process and measurement

| Doc | Purpose |
| --- | --- |
| [product/hr-product-owner-operating-model.md](./product/hr-product-owner-operating-model.md) | Feature briefs and numbered UAC |
| [product/feature-brief-template.md](./product/feature-brief-template.md) | Template for shippable capabilities |
| [product/feature-briefs/](./product/feature-briefs/) | Briefs **001**–**028** (canonical specs) |
| [product/codebase-completion-baseline.md](./product/codebase-completion-baseline.md) | Tracks A/B/C; §2c platform inventory; §2d briefs 023–028; per-feature audits §3+ |

### Completion audits

Index: [product/completion-audits/README.md](./product/completion-audits/README.md).

| Wave | Audit |
| --- | --- |
| **001–013** | [codebase-completion-baseline.md](./product/codebase-completion-baseline.md) §3–§3e |
| **006–013** | [features-006-013.md](./product/completion-audits/features-006-013.md) |
| **014–017** | [features-014-017.md](./product/completion-audits/features-014-017.md) |
| **018–021** | [features-018-021.md](./product/completion-audits/features-018-021.md) |
| **022** (shell) | [features-022.md](./product/completion-audits/features-022.md) |
| **023–025** (Phase C) | [features-023-025.md](./product/completion-audits/features-023-025.md) |
| **026** | [features-026.md](./product/completion-audits/features-026.md) |
| **027** (blocked) | [features-027.md](./product/completion-audits/features-027.md) |
| **028** | [features-028.md](./product/completion-audits/features-028.md) |
| Exit validation | [reference-customer-exit-validation.md](./product/completion-audits/reference-customer-exit-validation.md) |

### Competitive and market

| Doc | Purpose |
| --- | --- |
| [product/competitive-benchmark-executive-brief.md](./product/competitive-benchmark-executive-brief.md) | Executive summary (operations lens) |
| [product/competitive-ops-tco-worksheet.md](./product/competitive-ops-tco-worksheet.md) | Illustrative operate TCO vs SaaS PEPM |
| [product/competitive-ops-inventory.md](./product/competitive-ops-inventory.md) | Production/CI/worker inventory for benchmark |
| [../specs/competitive-analysis-roadmap.md](../specs/competitive-analysis-roadmap.md) | Parity matrix and strategic priorities |

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
