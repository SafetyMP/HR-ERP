# Architecture spec — <feature slug>

**Phase:** <e.g. Phase1_MVP>  
**ADR refs:** <links to `specs/alignment/decisions/`>  
**Module proposal:** <link to filled `docs/architecture/module-proposal-template.md`>

## Summary

## Bounded contexts

- **Owns:**  
- **Reads (API/events):**  
- **Forbidden:** cross-context DB writes

## Data model (Postgres / Prisma)

- Entities, keys, indexes  
- Effective dating / soft delete (if any)

## APIs

- Routes / actions  
- Idempotency  
- Versioning (`/v1`, deprecation)

## Async / events

- N/A or topics/outbox — **must match phase ADR**

## Migration plan

- Forward-only; new migration names  

## Open risks

| Risk | Owner |
| --- | --- |

## Innovation / R&D parity (`@hr-domain-boundaries`)

**Orchestrator runs this step immediately after Architecture** when stack/modernization applies. Load **`@hr-domain-boundaries`** → [innovation-gate.md](../../.cursor/skills/hr-domain-boundaries/references/innovation-gate.md). Complete **before** Legal/Integration consume this spec unless explicitly **N/A** with one-line scope justification (pure typo/copy/CSS churn).

| Item | Answer (bullets OK) |
| --- | --- |
| Phased alignment | Which phases (A–E) apply; additive layers (Edge, pgvector, Wasm, Rust, PQ, multimodal) |
| Source of truth | Authoritative writes vs derived artifacts (vectors, caches) |
| Failure modes | Degrade paths if Edge/search/worker lanes fail |
| Gates / proof | Benchmarks, A1–A6 search tests where relevant, rollout triggers |

If **N/A**, state: `Innovation parity: N/A — <reason>` and confirm no schema/API/infra/crypto/search modality change.

## AI data governance parity (`@hr-regulated-domain`)

**Orchestrator runs this step when conditional triggers apply** (see [`.cursor/rules/orchestrator-hr-erp.mdc`](../../.cursor/rules/orchestrator-hr-erp.mdc)). Load **`@hr-regulated-domain`** → [ai-governance.md](../../.cursor/skills/hr-regulated-domain/references/ai-governance.md). Complete **before** Implementation consumes this spec unless **N/A** with one-line PO scope.

| Item | Answer (bullets OK) |
| --- | --- |
| HITL | States, approvers, where execution is blocked without `APPROVED` |
| XAI | Explanation schema version, what HR users see, logging |
| Data minimization | Feature allowlist delta, sensitive fields justified or rejected |
| Audit | `GovernanceAuditEvent` / linkage to model version + explanation hash |

If **N/A**, state: `AI data governance parity: N/A — <reason>` and confirm no ML screening, scoring, governance API, or profiling surface change.

## API versioning & breaking changes

- Approver: Orchestrator + ADR for breaking API/schema  
