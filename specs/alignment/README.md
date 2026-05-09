# Vision alignment

When Architecture, Security, Integrations, QA, or Legal-process guidance **conflicts**:

1. Do **not** merge contradictory instructions into a single spec.  
2. Open a new markdown file in `decisions/` using `adr-template.md`.  
3. Link that ADR from every affected spec + PR description.  
4. **Revisit when:** ADR must name a concrete trigger (scale, second service, regulatory change), not “later maybe.”

**Orchestrator** keeps `specs/alignment/decisions/` the single source for phase topology. It also runs **step 1 — PO orchestration**: load `hr-product-owner`, verify a Feature brief (or spike ADR), and emit a short **PO orchestration checkpoint** before Architecture starts—see [`.cursor/rules/orchestrator.mdc`](../../.cursor/rules/orchestrator.mdc).

## Conflict log (optional table in PR)

| Topic | Agent A | Agent B | Resolution ADR |
| --- | --- | --- | --- |
