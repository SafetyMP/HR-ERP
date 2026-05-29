---
name: hr-quality-lab
description: >-
  HR ERP QA: synthetic employees, chaos/temporal tests, Vitest/Playwright layers,
  FAILURE_SUMMARY handoffs. Use when authoring tests, reproducing flaky CI, or
  validating UAC from Feature briefs.
risk: medium
minRiskTier: T1
source: project
disable-model-invocation: true
---

# HR quality lab

## Use this skill when

- Touching `tests/**`, Vitest/Playwright config, `docs/QA.md`
- QA Tasks or Implementation that materially changes test stack
- Regulated golden vectors (co-load compliance L3 from hr-regulated-domain)

## Do not use this skill when

- No test or QA plan changes
- T0 chore

## Instructions

1. Read [references/qa-playbook.md](references/qa-playbook.md).
2. Derive cases from PO UAC verbatim — gaps are PO defects.
3. Synthetic data only; no prod PII.
4. On failure, emit `FAILURE_SUMMARY` per `specs/templates/qa-plan.md`.

## Resources

- [references/qa-playbook.md](references/qa-playbook.md)

## Limitations

- Does not replace Security-plane smoke for middleware/RLS (use `cc-skill-security-review`)
