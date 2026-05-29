---
name: hr-orchestration-lanes
description: >-
  HR ERP function-lane recipes: payroll T3 counsel, migration custodian isolation,
  security sentinel SLA, parallel scout+architect greenfield. Use with manifest v2
  and ADR 0011.
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
2. **Greenfield T1:** parallel `scout` + `architect` → `builder` → parallel `sentinel` + `verifier`.
3. **DDL (T2+):** `architect` readonly → `custodian` (migrations only) → `builder` app code.
4. **Security plane:** `sentinel` mandatory before merge (`middleware.ts`, `lib/security/**`).
5. **Payroll/compliance (T3):** add readonly `counsel`; load `@hr-regulated-domain` (max 3 bodies with product-gate in v3).
6. **AI governance paths:** add readonly `ai_governance_reviewer` (`docs/ai-governance/`, `lib/governance/`, threat model doc).
7. **Product MCP (`lib/copilot/**`):** `ai_governance_reviewer` + `sentinel` after `builder` — do **not** route catalog-only work to `mlops_reviewer` alone; load `@hr-product-mcp-governance` (max 3 bodies with `@hr-product-gate` in v3).
8. **MLOps inference only (`docs/ml/`, `services/ml-serving/`):** add `mlops_reviewer` readonly Task.
9. **T4 ≥2 Tasks:** `finops_coordinator` + `@hr-swarm-governance` FinOps note.

## Resources

- [ADR 0011](../../../specs/alignment/decisions/0011-function-lane-orchestration.md)
- [cursor-antigravity-harness.md](../../../docs/meta/cursor-antigravity-harness.md)
- [governance-manifest.yaml](../../governance/governance-manifest.yaml)

## Limitations

- Archived `hr-erp-*` skill names are invalid in new handoffs — use consolidated `hr-*` skills only
