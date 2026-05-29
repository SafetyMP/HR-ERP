---
name: hr-product-gate
description: >-
  Gates HR ERP product work: Feature briefs, UAC, friction checks (~10s employee
  pay tasks), standard HR terminology. Use when scoping features, writing UAC,
  reviewing HR/payroll UX, or before engineering starts a new capability.
risk: safe
minRiskTier: T1
source: project
disable-model-invocation: true
---

# HR product gate

## Use this skill when

- Starting a new capability (Orchestrator step 1)
- Writing or reviewing Feature briefs and UAC
- QA derives tests from acceptance criteria
- Scope, persona, or friction checks are in play

## Do not use this skill when

- T0 docs-only chore with `step 1 chore N/A`
- Pure infra with no user-visible outcome (still may need brief/spike ADR)

## Instructions

1. Read [references/operating-model.md](references/operating-model.md).
2. Verify brief under `docs/product/feature-briefs/` or spike ADR exists.
3. Confirm PO gate: user, pain, outcome, scope boundary filled.
4. Emit **PO checkpoint** (≤6 lines) before Architecture.
5. Use standard HR terms (paystub, earnings statement, headcount — not invented jargon).

## Resources

- [references/operating-model.md](references/operating-model.md)
- [docs/product/feature-brief-template.md](../../../docs/product/feature-brief-template.md)

## Limitations

- Product gate only — not implementation or legal advice
