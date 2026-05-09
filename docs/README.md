# Documentation index — HR ERP

Start here to navigate human-written docs. Cursor agent orchestration and skills live under [`.cursor/`](../.cursor/).

## New contributors

| Doc | Purpose |
| --- | --- |
| [../README.md](../README.md) | Project overview, quick start, script reference |
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
| [product/hr-product-owner-operating-model.md](./product/hr-product-owner-operating-model.md) | How Feature briefs and UAC work |
| [product/feature-brief-template.md](./product/feature-brief-template.md) | Template for shippable capabilities |
| [product/codebase-completion-baseline.md](./product/codebase-completion-baseline.md) | How to measure completion (UAC / phase gates); Feature 001 primary gap; canonical **repo** agent skills (`§2a`) vs global Cursor marketplace skills; payroll/ML orchestration bundles (`§2b`); Feature 001 UAC audit |

## Operations

| Doc | Purpose |
| --- | --- |
| [operations/production-rollback-runbook.md](./operations/production-rollback-runbook.md) | Rollback checklist |
| [operations/vercel-managed-phase1-environment.md](./operations/vercel-managed-phase1-environment.md) | Managed deploy notes |

## UI

| Doc | Purpose |
| --- | --- |
| [../FRONTEND.md](../FRONTEND.md) | React state, a11y, API errors, demo routes |
