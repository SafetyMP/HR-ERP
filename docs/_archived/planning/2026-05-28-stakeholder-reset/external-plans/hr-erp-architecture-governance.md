# ARCHIVED excerpt — Architecture governance

**Status:** ARCHIVED — see [stakeholder-value-plan.md](../../../product/stakeholder-value-plan.md)  
**Source:** `~/.cursor/plans/hr_erp_architecture_governance_d57fbc82.plan.md`

## Durable decisions (target topology)

- Single writer per aggregate; no cross-database FKs; business UUID keys only.
- Payroll never mutates Core HR DB — events + read APIs only.
- Module proposals require: bounded context, schema, OpenAPI/proto, Kafka topics, lock-order notes.
- Phase 1 runtime: single Postgres per [0001-phase1-scope.md](../../../../specs/alignment/decisions/0001-phase1-scope.md).

## Deferred until ADR trigger

- Kafka + DB-per-context production wiring (compose profile exists; not production default).
