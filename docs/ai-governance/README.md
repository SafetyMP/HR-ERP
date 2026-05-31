# AI ethics and data governance

This folder defines **non-negotiable** product and engineering requirements for **machine learning models, predictive analytics, and automated decision support** across the HR ERP.

It complements (not replaces) legal review: [docs/compliance/README.md](../compliance/README.md). **This is not legal advice.**

## Audience

- Engineering and ML/Data teams shipping AI-backed HR features.
- Security, privacy, and internal auditors reviewing changes.
- Product and HR operations defining human workflows.

## Scope

In scope: resume screening assistance, ranking/scoring of candidates, performance prediction, churn or attrition risk scores, PIP or investigation **suggestions**, compensation **recommendations**, and any system that profiles natural persons in an employment context.

Out of scope (still follow security baselines): non-ML business rules, deterministic calculators with published formulas (e.g., gross-to-net modules with cited statutes).

**Cursor agents:** Load **`@hr-regulated-domain`** (AI L3: [references/ai-governance.md](../../.cursor/skills/hr-regulated-domain/references/ai-governance.md)) when implementing or reviewing AI governance; co-load **`@hr-product-mcp-governance`** for in-app copilot MCP work.

## Documents

| Document | Purpose |
|----------|---------|
| [HITL_POLICY.md](./HITL_POLICY.md) | Human-in-the-loop: prohibited autonomous actions, approval roles, dual control |
| [DATA_MINIMIZATION.md](./DATA_MINIMIZATION.md) | Purpose limitation, sensitive attributes, masking, retention |
| [XAI_REQUIREMENTS.md](./XAI_REQUIREMENTS.md) | Explainability payloads, HR-facing disclosures, logging |
| [PR_CHECKLIST.md](./PR_CHECKLIST.md) | PR gates before merging AI-impacting code |
| [MODEL_CARD_TEMPLATE.md](./MODEL_CARD_TEMPLATE.md) | Model/dataset documentation template |
| [STACK_AND_ARCHITECTURE.md](./STACK_AND_ARCHITECTURE.md) | Reference stack mapping to enforcement services |

## Escalation

| Concern | Primary owner |
|---------|----------------|
| Lawful basis, DPIA, cross-border transfer | **DPO / Legal** |
| Algorithmic bias testing methodology, fairness metrics | **ML Lead + Legal** (protected attributes vary by jurisdiction) |
| Security of PII and model artifacts | **Security** |
| Access control and audit log integrity | **Security + Engineering** |

## Versioning

Update the **Revision** footer when changing policy meaning. Breaking changes require Orchestrator sign-off and a linked ADR.

Apply schema changes with Prisma after editing [`prisma/schema.prisma`](../../prisma/schema.prisma): migration folder [`prisma/migrations/20260509160000_ai_governance_hitl_audit/`](../../prisma/migrations/20260509160000_ai_governance_hitl_audit/migration.sql) (run `npx prisma migrate deploy` against your Postgres when the database is available).

---

Revision: 2026-05-09 · Owner: AI Governance Council (process owner TBD)
