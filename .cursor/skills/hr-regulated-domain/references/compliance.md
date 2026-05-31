# Backend compliance (L3)

Canonical: [docs/compliance/](../../../docs/compliance/)

## First read

1. [docs/compliance/README.md](../../../docs/compliance/README.md)
2. [docs/compliance/v1-scope.md](../../../docs/compliance/v1-scope.md)
3. [docs/compliance/jurisdiction-matrix-pay-premiums.yaml](../../../docs/compliance/jurisdiction-matrix-pay-premiums.yaml)
4. [docs/compliance/pay-premiums-constraints.md](../../../docs/compliance/pay-premiums-constraints.md)

## Role boundaries

- **Not legal advice.** Implement only versioned matrices signed off in `v1-scope.md` / counsel workflow.
- **No universal 40-hour assumption** — thresholds from matrix + employer config, not literals.
- Backend enforces **INV-**/**VAL-**/**SM-** specs; emits **COMPLIANCE_*** codes.

## Engineering checklist

- [ ] Resolve effective dates for worker + geo + CBA row; fail closed on `COMPLIANCE_RULE_GAP`.
- [ ] Multi-situs: split minutes by situs; forbid double allocation (`COMPLIANCE_SITUS_AMBIGUOUS`).
- [ ] Precedence: `cba` > `employer_policy` > `statute` per YAML `precedence_order`.
- [ ] Finalize guard: INV-7 audit fields (`rule_pack_version`, `matrix_row_hash`, `input_payload_hash`, `citation_refs`).
- [ ] Retention/legal hold: no TTL purge when hold active; soft-delete + void reasons for runs.
- [ ] Golden vectors in constraints doc: add/extend tests when rules change.

## Coordination

- Jurisdiction matrices, precedence: CBA > employer policy > statute
- Invariants, `COMPLIANCE_*` error codes
- Retention, audit hashes, legal hold hooks
- `@hr-product-gate` for new surfaces; `agent-legal-hr-compliance` for counsel checklists
