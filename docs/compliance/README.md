# Backend compliance framework

Principal HR Legal & Compliance artifacts for **jurisdiction-aware** pay and labor rules. Engineering implements **versioned** rules against these specs; Legal owns statutory interpretation.

## Contents

| Document | Purpose |
|----------|---------|
| [v1-scope.md](v1-scope.md) | Declared v1 feature, jurisdictions, worker types, PHI/biometric scope |
| [jurisdiction-matrix-pay-premiums.yaml](jurisdiction-matrix-pay-premiums.yaml) | Precedence-ordered matrix (CBA > employer policy > statute floor) for pay premiums |
| [pay-premiums-constraints.md](pay-premiums-constraints.md) | Invariants, validations, state machines, retention, acceptance criteria, golden vectors |
| [july-2026-us-state-calendar.md](july-2026-us-state-calendar.md) | Counsel-gated mid-2026 US state calendar → recruiting teaching surfaces (pay transparency / Fair Chance) |
| [AI governance playbook](../ai-governance/README.md) | EU AI Act-oriented controls: HITL, data minimization, XAI, model cards, PR checklist |

## How other agents use this

1. Read `v1-scope.md` before implementing pay or time calculations consumed by earnings statements.
2. Resolve applicable rules via `jurisdiction-matrix-pay-premiums.yaml` using worker **effective-dated** situs and union/CBA flags.
3. Implement predicates and calculations so all **invariants** in `pay-premiums-constraints.md` hold; emit **COMPLIANCE_*** error codes as specified.
4. Store **rule_version**, **inputs hash**, and **citation ids** on every finalized pay line for audit (SOC 2 / wage claims).

**Disclaimer:** Not legal advice. Align matrices and periods with counsel before production jurisdictions go live.
