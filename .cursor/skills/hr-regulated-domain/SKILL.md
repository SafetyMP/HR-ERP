---
name: hr-regulated-domain
description: >-
  HR ERP regulated domains: wage/hour compliance, payroll calculation kernel,
  employment AI governance, MLOps/inference routing. Use for pay/time APIs,
  packages/payroll-calc, docs/compliance, lib/governance, screening/scoring.
risk: critical
minRiskTier: T3
source: project
disable-model-invocation: true
---

# HR regulated domain

## Use this skill when

- Pay, time, earnings, jurisdiction matrices, `COMPLIANCE_*` errors
- `packages/payroll-calc/`, fingerprints, gross-to-net replay
- ML screening, scoring, governance APIs, `docs/ai-governance/`
- Product MCP / inference paths with employment impact — co-load `@hr-product-mcp-governance` and [references/product-mcp.md](references/product-mcp.md) when `lib/copilot/**` changes

## Do not use this skill when

- Non-pay UI with no compliance or AI scoring surface
- T1/T2 work with no regulated path triggers

## Instructions

1. Load the relevant L3 reference(s) below — one domain at a time.
2. Compliance + payroll kernel: read both when pay math executes.
3. AI governance + MLOps: co-load when inference and scoring both change.
4. Legal checklist → `specs/templates/legal-checklist.md`; counsel confirms interpretation.

## Resources

- [references/compliance.md](references/compliance.md)
- [references/payroll-kernel.md](references/payroll-kernel.md)
- [references/ai-governance.md](references/ai-governance.md)
- [references/mlops.md](references/mlops.md)
- [references/product-mcp.md](references/product-mcp.md) — in-app copilot MCP (use `@hr-product-mcp-governance` for catalog/transport)

## Limitations

- Engineering controls only — not legal advice
- Product runtime MCP still follows `docs/security/agent-mcp-threat-model.md`
