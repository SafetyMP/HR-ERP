---
name: hr-ai-data-governance
description: >-
  Enforces HR AI ethics and data governance: EU AI Act–oriented controls for
  high-risk employment AI, algorithmic bias and XAI requirements, data
  minimization, mandatory human-in-the-loop (HITL) before hire/terminate/comp/PIP
  actions, append-only audit and explanation snapshots. Use when designing or
  reviewing ML, predictive analytics, LLM features, resume screening, performance
  prediction, churn scoring, model registry, or governance APIs; when the user
  mentions bias, explainability, data masking, HITL, EU AI Act, or AI HR
  automation; or when touching docs/ai-governance or lib/governance.
disable-model-invocation: false
---

# HR AI ethics and data governance (repo skill)

## Workspace grounding

Before citing paths, scripts, APIs, or dependencies for **this repo**, apply [workspace grounding](../README.md) against the active checkout—use Read/Grep (or search), not training-data defaults.

## First read (source of truth)

Load these before changing AI/ML decision support, scoring, or governance code:

1. [docs/ai-governance/README.md](../../../docs/ai-governance/README.md)
2. [docs/ai-governance/HITL_POLICY.md](../../../docs/ai-governance/HITL_POLICY.md)
3. [docs/ai-governance/DATA_MINIMIZATION.md](../../../docs/ai-governance/DATA_MINIMIZATION.md)
4. [docs/ai-governance/XAI_REQUIREMENTS.md](../../../docs/ai-governance/XAI_REQUIREMENTS.md)
5. [docs/ai-governance/PR_CHECKLIST.md](../../../docs/ai-governance/PR_CHECKLIST.md)

Templates: [MODEL_CARD_TEMPLATE.md](../../../docs/ai-governance/MODEL_CARD_TEMPLATE.md).  
Code map: [STACK_AND_ARCHITECTURE.md](../../../docs/ai-governance/STACK_AND_ARCHITECTURE.md).

## Role boundaries

- **Not legal advice.** Treat playbook as engineering + product controls; **DPO/Legal** own lawful basis, DPIA, and jurisdiction-specific HR law.
- **No autonomous high-stakes execution:** hire, fire, compensation change, and PIP initiation **require** human review, documented approval, and governed execution paths (see HITL policy).
- **Bias / fairness:** disparity testing and protected-class handling **must** align with counsel-approved definitions; do not invent sensitive attributes or proxies (e.g. ZIP) without documented justification.

## Non-negotiable engineering rules

| Area | Rule |
|------|------|
| HITL | Proposal states: `PROPOSED` → `AWAITING_REVIEW` → `APPROVED` → execution; **never** persist high-stakes employment actions without `APPROVED` + [`executeApprovedProposal`](../../../lib/governance/high-stakes.ts). |
| XAI | Persist a **versioned explanation snapshot** for each proposal; HR-facing copy matches [XAI_REQUIREMENTS.md](../../../docs/ai-governance/XAI_REQUIREMENTS.md). |
| Data | Feature **allowlists** and Data Impact notes per [DATA_MINIMIZATION.md](../../../docs/ai-governance/DATA_MINIMIZATION.md); separate analytics vs operational paths where applicable. |
| Audit | Append-only [`GovernanceAuditEvent`](../../../prisma/schema.prisma) via [`appendGovernanceAudit`](../../../lib/governance/audit.ts); link model version / dataset snapshot IDs when available. |
| Authz | DB access through [`withAuthorizedTransaction`](../../../lib/security/with-authorized-transaction.ts) so tenant RLS GUCs apply; permissions `governance:*` in [permissions.ts](../../../lib/security/permissions.ts). |

## Implementation anchors (this repo)

| Concern | Location |
|---------|----------|
| Explanation schema + hash | [lib/governance/explanations.ts](../../../lib/governance/explanations.ts) |
| HITL transitions | [lib/governance/hitl.ts](../../../lib/governance/hitl.ts), [lib/governance/proposals.ts](../../../lib/governance/proposals.ts) |
| Execution guard | [lib/governance/high-stakes.ts](../../../lib/governance/high-stakes.ts) |
| HTTP API | [src/app/api/governance/](../../../src/app/api/governance/) |
| Prisma models | `AiDecisionProposal`, `AiExplanationSnapshot`, `GovernanceAuditEvent`, `HighStakesEmploymentAction` in [schema](../../../prisma/schema.prisma) |

## PR merge gate

Complete [PR_CHECKLIST.md](../../../docs/ai-governance/PR_CHECKLIST.md) for any PR that touches model inputs, scoring, prompts, governance tables, or HR automation.

## Coordination with other skills

- **MLOps / routing / drift:** [.cursor/skills/hr-erp-mlops/SKILL.md](../hr-erp-mlops/SKILL.md)
- **Pay and labor rule packs:** [.cursor/skills/hr-backend-compliance/SKILL.md](../hr-backend-compliance/SKILL.md)
- **PO / UAC:** [.cursor/skills/hr-product-owner/SKILL.md](../hr-product-owner/SKILL.md)
- **Architecture / edge:** [.cursor/skills/hr-erp-innovation-rd/SKILL.md](../hr-erp-innovation-rd/SKILL.md)

## Orchestration (binding)

The **Orchestrator** ([`.cursor/rules/orchestrator.mdc`](../../rules/orchestrator.mdc), `alwaysApply`) sequences this skill **conditionally** after Innovation parity and **before** Implementation when triggers match. Cursor **Task** prompts must attach **`hr-ai-data-governance`** and **agent-ai-governance** (`.cursor/rules/agent-ai-governance.mdc`) for Implementation and QA on in-scope features. See orchestrator **Sequence** step and **Task** rules for MLOps co-loading.

## Deeper reference

Compact regulatory framing, success criteria, and copy-paste stubs: [reference.md](reference.md).
