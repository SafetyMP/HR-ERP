# Innovation challenge gate (slim)

Replaces archived `hr-erp-innovation-rd` for stack/modernization proposals without full skill bloat.

## When to invoke

Before proposing: Edge-only rewrite, multi-DB day-one, Kafka before outbox proof, premium model default, or "legacy on day one" removals.

## Challenge questions

1. **System of record** — Does Postgres monolith + Prisma remain authoritative for Phase 1?
2. **Additive vs replace** — Is this expand–migrate–contract, not big-bang?
3. **Bounded context** — Single writer per aggregate preserved?
4. **Cost of failure** — What breaks if the spike is wrong? Rollback path?
5. **PO value** — Which stakeholder outcome from [stakeholder-value-plan.md](../../../docs/product/stakeholder-value-plan.md)?

## Outcomes

- **Proceed** — Spike ADR + T2+ architect lane
- **Defer** — Log in feature brief N/A with reason
- **Reject** — Conflicts with ADR 0001/0002 phase scope

Load `@hr-domain-boundaries` for architecture depth; do not load full archived innovation skill.
