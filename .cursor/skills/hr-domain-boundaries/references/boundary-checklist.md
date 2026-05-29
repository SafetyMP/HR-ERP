# HR ERP boundary checklist (L3)

Read in order:

1. [docs/architecture/README.md](../../../docs/architecture/README.md)
2. [docs/architecture/bounded-contexts.md](../../../docs/architecture/bounded-contexts.md)
3. [docs/architecture/module-proposal-template.md](../../../docs/architecture/module-proposal-template.md)
4. [docs/architecture/slo-and-load-gates.md](../../../docs/architecture/slo-and-load-gates.md)
5. [specs/alignment/decisions/0002-postgres-kafka-context-boundaries.md](../../../specs/alignment/decisions/0002-postgres-kafka-context-boundaries.md)

## Non-negotiables

- Single writer per aggregate in owning context
- No cross-database FKs — stable business IDs as plain columns
- Payroll never mutates Core HR DB — events + read APIs only
- Forward-only migrations on shared branches

## Innovation / R&D parity (when triggered)

Fill parity table in `specs/templates/architecture-spec.md` or one-line N/A with scope.
