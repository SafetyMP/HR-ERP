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

### Phase 2 — Strategy options (HOTL)

Present **≥2** lane DAG alternatives with risk, reward, rollback, and deferred specialized skills. Use [collaboration-plan.md](../../../specs/templates/collaboration-plan.md).

### Phases 4–7 — Execution

1. Run `npm run governance:lint` — note `Required lanes` and `Suggested lanes`.
2. Run `npm run governance:plan` — use `regulatedGraph` + `delegatedTaskPlan` + `collaborationPlan` for `/multitask`.
3. **Plan Mode bridge:** save `.cursor/plans/*.md` → human revalidation → `governance:plan` → `/multitask` (phase 6+ only).
4. **Greenfield T1:** parallel `scout` + `architect` → `builder` → parallel `sentinel` + `verifier`.
5. **DDL (T2+):** `/worktree` + [worktrees.json](../../worktrees.json); `architect` readonly → `custodian` → `builder`.
6. **Ops / CI / deploy (T2+):** `release_ops` after architect when `.github/workflows`, `vercel.json`, `docs/operations/**` change; load `@devops-product-lifecycle` + `@hr-devops-lifecycle`.
7. **Security plane:** `sentinel` mandatory before merge (`middleware.ts`, `lib/security/**`).
8. **Payroll/compliance (T3):** add readonly `counsel`; load `@hr-regulated-domain` after revalidation (max 3 bodies with product-gate).
9. **AI governance paths:** add readonly `ai_governance_reviewer` (`docs/ai-governance/`, `lib/governance/`, threat model doc).
10. **Product MCP (`lib/copilot/**`):** `ai_governance_reviewer` + `sentinel` after `builder`; load `@hr-product-mcp-governance` after revalidation.
11. **MLOps inference only (`docs/ml/`, `services/ml-serving/`):** add `mlops_reviewer` readonly Task.
12. **T4 ≥2 Tasks:** `finops_coordinator` + `@hr-swarm-governance` FinOps note.

## Resources

- [ADR 0011](../../../specs/alignment/decisions/0011-function-lane-orchestration.md)
- [cursor-3-native-runtime.md](../../../docs/meta/cursor-3-native-runtime.md)
- [hook-rollout-schedule.md](../../../docs/meta/hook-rollout-schedule.md)
- [governance-manifest.yaml](../../governance/governance-manifest.yaml)
- Promoted learning: [references/learning/6f436872-80bd-42b9-9d49-20da21203d33.md](references/learning/6f436872-80bd-42b9-9d49-20da21203d33.md) (lane_gap harness_foundation)

## Limitations

- Archived `hr-erp-*` skill names are invalid in new handoffs — use consolidated `hr-*` skills only
