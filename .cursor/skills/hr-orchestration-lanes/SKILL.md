---
name: hr-orchestration-lanes
description: >-
  HR ERP function-lane recipes: payroll T3 counsel, migration custodian isolation,
  security sentinel SLA, parallel scout+architect greenfield. Use with   manifest v4 and ADR 0011 / 0016.
risk: medium
minRiskTier: T1
source: project
disable-model-invocation: true
---

# HR orchestration lanes

## Use when

- Orchestrating HR ERP features in Cursor (tier ≥ T1)
- Diff touches pay, compliance, AI governance, migrations, or security plane

## Instructions

1. Run `npm run governance:lint` — note `Required lanes` and `Suggested lanes`.
2. Run `npm run governance:plan` — use `regulatedGraph` + `delegatedTaskPlan` for `/multitask`.
3. **Plan Mode bridge:** save `.cursor/plans/*.md` → approve → `governance:plan` → `/multitask`.
4. **Greenfield T1:** parallel `scout` + `architect` → `builder` → parallel `sentinel` + `verifier`.
3. **DDL (T2+):** `/worktree` + [worktrees.json](../../worktrees.json); `architect` readonly → `custodian` → `builder`.
4. **Ops / CI / deploy (T2+):** `release_ops` after architect when `.github/workflows`, `vercel.json`, `docs/operations/**` change; load `@devops-product-lifecycle` + `@hr-devops-lifecycle`.
5. **Security plane:** `sentinel` mandatory before merge (`middleware.ts`, `lib/security/**`).
6. **Payroll/compliance (T3):** add readonly `counsel`; load `@hr-regulated-domain` (max 3 bodies with product-gate in v3).
7. **AI governance paths:** add readonly `ai_governance_reviewer` (`docs/ai-governance/`, `lib/governance/`, threat model doc).
8. **Product MCP (`lib/copilot/**`):** `ai_governance_reviewer` + `sentinel` after `builder` — do **not** route catalog-only work to `mlops_reviewer` alone; load `@hr-product-mcp-governance` (max 3 bodies with `@hr-product-gate` in v3).
9. **MLOps inference only (`docs/ml/`, `services/ml-serving/`):** add `mlops_reviewer` readonly Task.
10. **T4 ≥2 Tasks:** `finops_coordinator` + `@hr-swarm-governance` FinOps note.

## Resources

- [ADR 0011](../../../specs/alignment/decisions/0011-function-lane-orchestration.md)
- [cursor-antigravity-harness.md](../../../docs/meta/cursor-antigravity-harness.md)
- [governance-manifest.yaml](../../governance/governance-manifest.yaml)

## Limitations

- Archived `hr-erp-*` skill names are invalid in new handoffs — use consolidated `hr-*` skills only
