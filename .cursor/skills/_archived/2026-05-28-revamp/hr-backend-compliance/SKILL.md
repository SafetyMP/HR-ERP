---
name: hr-backend-compliance
description: >-
  Principal HR/Legal compliance posture for backend rule packs: jurisdiction
  matrices, precedence (CBA > employer policy > statute), invariants,
  validations, state machines, retention/legal hold, audit hashes, and
  COMPLIANCE_* errors. Use when implementing or reviewing payroll/time APIs,
  pay allocation, overtime or premium pay, multi-situs work, exempt vs
  non-exempt handling, union overrides, minor hour caps, paystub/earnings
  computation, Prisma models touching pay or time, or when the user mentions
  FLSA, wage and hour, GDPR retention, SOC 2 payroll audit, or docs/compliance.
---

# HR ERP backend compliance (repo skill)

## Workspace grounding

Before citing paths, scripts, APIs, or dependencies for **this repo**, apply [workspace grounding](../README.md) against the active checkout—use Read/Grep (or search), not training-data defaults.

## First read (source of truth)

Load these in order before changing pay, time, or compliance logic:

1. [docs/compliance/README.md](../../../docs/compliance/README.md)
2. [docs/compliance/v1-scope.md](../../../docs/compliance/v1-scope.md)
3. [docs/compliance/jurisdiction-matrix-pay-premiums.yaml](../../../docs/compliance/jurisdiction-matrix-pay-premiums.yaml)
4. [docs/compliance/pay-premiums-constraints.md](../../../docs/compliance/pay-premiums-constraints.md)

Repository entry: [AGENTS.md](../../../AGENTS.md) (compliance link + PO gates).

## Role boundaries

- **Not legal advice.** Implement only **versioned** matrices and policies **signed off** in `v1-scope.md` / counsel workflow.
- **No universal 40-hour assumption** and **no single jurisdiction** in code: thresholds and workweek anchors come from **data** (matrix + employer config), not literals.
- **Frontend does not own** these rules; backend enforces **INV-**/**VAL-**/**SM-** specs and emits **COMPLIANCE_*** codes from [pay-premiums-constraints.md](../../../docs/compliance/pay-premiums-constraints.md).

## Engineering checklist (every change)

- [ ] Resolve **effective dates** for worker + geo + CBA row; fail closed on `COMPLIANCE_RULE_GAP`.
- [ ] **Multi-situs:** split minutes by situs; forbid double allocation (`COMPLIANCE_SITUS_AMBIGUOUS`).
- [ ] **Precedence:** apply `cba` > `employer_policy` > `statute` per YAML `precedence_order`.
- [ ] **Finalize guard:** INV-7 audit fields present (`rule_pack_version`, `matrix_row_hash`, `input_payload_hash`, `citation_refs`).
- [ ] **Retention/legal hold:** no TTL purge when hold active; soft-delete + void reasons for runs.
- [ ] **Golden vectors** in constraints doc: add/extend tests when rules change.

## Regulatory map (feature-specific)

Use the taxonomy in the compliance plan only as a **prompt list**—always narrow to what the feature touches (wage/hour, tax, privacy, etc.). Do not cite law without counsel-approved citations in the matrix.

## Coordination with other agents

- **Orchestrator:** [.cursor/rules/orchestrator.mdc](../../rules/orchestrator.mdc) (`alwaysApply`) sequences this skill for pay/time/compliance scope and instructs Cursor **Task** prompts to attach `hr-backend-compliance` + **agent-legal-hr-compliance** together. If the Orchestrator is active, follow that sequence before signing off Implementation.
- **Product / PO:** Feature brief + UAC before new surfaces; see [.cursor/skills/hr-product-owner/SKILL.md](../hr-product-owner/SKILL.md).
- **Process / checklist drafts:** [.cursor/rules/agent-legal-hr-compliance.mdc](../../rules/agent-legal-hr-compliance.mdc) (non-advice checklists).

## Optional deep reference

For narrative regulatory domains and edge-case dimensions (tenure, age, location, contract type), see [reference.md](reference.md).
