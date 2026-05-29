# Repo architecture docs (progressive disclosure)

| Document | Purpose |
|---------|---------|
| [docs/architecture/01-phase-a-core-boundaries.md](../../../docs/architecture/01-phase-a-core-boundaries.md) | Tenancy, OIDC/SSO, RBAC, audit + domain events |
| [docs/architecture/02-phase-bc-edge-semantic-search.md](../../../docs/architecture/02-phase-bc-edge-semantic-search.md) | Edge/CDN caches, pgvector MVP, semantic search acceptance tests |
| [docs/architecture/03-wasm-rust-adoption-triggers.md](../../../docs/architecture/03-wasm-rust-adoption-triggers.md) | Wasm & Rust profiling + merge/rollback thresholds |
| [docs/architecture/04-crypto-pqc-multimodal-apis.md](../../../docs/architecture/04-crypto-pqc-multimodal-apis.md) | Crypto abstraction, PQ checklist, modality-agnostic API shapes |

Executable schema sketch: [`prisma/schema.prisma`](../../../prisma/schema.prisma)

## Invoking across agents / sessions

| Consumer | Invocation |
|---------|-------------|
| Human or primary agent | Type `@hr-erp-innovation-rd` in Cursor chat |
| Task / delegated agents | Paste “Follow workspace skill **`hr-erp-innovation-rd`** (read `.cursor/skills/hr-erp-innovation-rd/SKILL.md`)” |

Committing `.cursor/skills/hr-erp-innovation-rd/` makes the skill portable for every clone/teammate.
