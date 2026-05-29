# ARCHIVED excerpt — Compliance rule framework

**Status:** ARCHIVED — implemented in `docs/compliance/`  
**Source:** `~/.cursor/plans/hr_compliance_rule_framework_434cfbdc.plan.md`

## Durable decisions

- Jurisdiction matrix with precedence: CBA > employer policy > statute.
- Golden vectors in `packages/payroll-calc/`; counsel gate before production statutory claims.
- Invariants, state machines, retention schedules per data category — not one global TTL.
- Never assume 40-hour week or single tax jurisdiction.

## Active docs

- [docs/compliance/README.md](../../../compliance/README.md)
- [docs/compliance/jurisdiction-matrix-pay-premiums.yaml](../../../compliance/jurisdiction-matrix-pay-premiums.yaml)
