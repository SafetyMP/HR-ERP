# Phase B — Global UX Layer (Edge / CDN)

## Goals

Reduce **tail latency** and offload **read-heavy, low-risk** traffic from origin while preserving **tenant isolation** and **correct invalidation**. Edge is **not** a second system of record.

## Allowed at Edge

| Capability | Typical implementation | Preconditions |
|------------|-------------------------|---------------|
| AuthN gate | JWT validation (JWKS cached at Edge); session cookie → short-lived JWT refresh at origin only | JWKS pinning + clock skew budgets |
| AuthZ coarse filter | Tenant claim present + route allowlists | Fine-grained RBAC remains origin |
| Read-through cache | Org directory shards, reference picklists | Keys include tenant + versioning |
| Geo routing | Send user to nearest read region via DNS / routing rules | Writes still pin to authoritative region |

## Forbidden at Edge (MVP hard rules)

| Anti-pattern | Why |
|--------------|-----|
| Payroll or comp **writes** | Strong consistency & audit obligations |
| Embedding generation blocking request | Moves CPU + PII exposure to unstable path |
| Long-lived Postgres connections from Edge | Wrong runtime model |

## CDN / Edge cache keys

Recommended key shape:

```text
v1:{tenantId}:{resource}:{resourceVersion}
```

Examples:

| Resource | `resource` | Version source |
|----------|-------------|----------------|
| Org tree subtree | `org:{orgUnitId}` | `OrganizationUnit.updatedAt` max in subtree OR materialized **`orgGraphVersion`** (tenant counter bumped on OU change — simpler invalidation). |
| Public assets | hashed filename | Content hash |

**ETag discipline**: Origin returns `ETag` derived from `resourceVersion`; Edge validates with `If-None-Match` where supported.

## Invalidation triggers

| Event (from core / DomainEvent consumer) | Action |
|------------------------------------------|--------|
| `OrganizationUnit` create/update/delete | Invalidate `org:*` keys for tenant; optionally prefetch warm paths |
| `Employee` reassigned to OU | Invalidate affected `org:{ou}` caches + `employee:{id}` if cached |
| Tenant offboarding | Purge tenant key prefix |

**Stale-while-revalidate**: acceptable for directory reads if UI tolerates eventual consistency (< few seconds); **never** for permission bits that authorize sensitive writes without origin check.

## Failure modes

| Layer down | UX |
|-----------|-----|
| Edge cache unavailable | Fallback to origin; increase rate limits vigilantly |
| Origin timeout | Structured 503 + retry backoff; cached reads may still succeed if Edge stale allowed |

---

# Phase C — Semantic HR MVP (`pgvector` first)

Embeddings are **derived** artifacts; Postgres remains source of IDs and ACL metadata.

## Database extension

1. Enable in Postgres:

   ```sql
   CREATE EXTENSION IF NOT VECTOR;
   ```

2. **Prisma limitation**: unsupported native `vector` type in stable generator — manage embedding table via **`prisma db execute`** or raw migration SQL:

   ```sql
   CREATE TABLE "SearchDocument" (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     "tenantId" uuid NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
     "sourceType" text NOT NULL,
     "sourceId" text NOT NULL,
     "embedding" vector(768) NOT NULL,
     content text NOT NULL,
     metadata jsonb,
     CONSTRAINT search_unique_source UNIQUE ("tenantId", "sourceType", "sourceId")
   );
   CREATE INDEX search_embedding_ivfflat ON "SearchDocument"
     USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
   ```

   Tune dimensions to your embedding model (`768`, `1536`, etc.). Revisit index type **HNSW** vs **IVFFlat** under load.

3. Optionally map with Prisma:

   ```prisma
   /// Managed via SQL migration — column type unsupported in schema until upgraded.
   model SearchDocument {
     id String @id @db.Uuid
     // ...
   }
   ```

   If full Prisma modelling is premature, treat this table as **migration-only** and query via `$queryRaw` until types stabilize.

## Ingest pipeline (high level)

1. **`DomainEvent`** published: `EmployeeProfileUpdated`, `PolicyDocPublished`.
2. Worker extracts **minimal text** (skills, summaries — **avoid** dumping full PHI).
3. Worker embeds batch → UPSERT into `SearchDocument`.
4. On delete: remove row synchronously when source entity deleted.

## Query path

1. User issues semantic query at BFF.

2. BFF resolves **allowed filter** set from RBAC (`tenantId`, visible `organizationId` set, clearance flags).

3. SQL pattern (conceptual):

   ```sql
   SELECT "sourceType", "sourceId", metadata
   FROM "SearchDocument"
   WHERE "tenantId" = $tenant
     AND "organizationId" = ANY($visibleOrgs)
   ORDER BY "embedding" <=> $queryVector
   LIMIT $k;
   ```

   **Never** omit tenant + ACL predicates — add automated tests below.

---

## Acceptance tests — semantic search MVP (must pass before GA)

Automated (CI) suites:

### A1 — Tenant isolation

- **Given**: two tenants A and B with similar employee text.
- **When**: semantic search runs with tenant A credentials.
- **Then**: zero rows from tenant B regardless of similarity score ordering.

### A2 — Authorization predicate enforcement

- **Given**: Employee E in Org O1; requester lacks access to O1 but has sibling O2 access.
- **When**: semantic search queries text unique to E.
- **Then**: E not returned.

### A3 — Rebuildability

- **Given**: `SearchDocument` snapshot dropped.
- **When**: ingestion replays recent `DomainEvent` backlog.
- **Then**: searchable results restored within SLA (define RTO, e.g. 24h bulk or 15m incremental).

### A4 — Grounding / audit

- **Given**: retrieval returns hit for policy corpus.
- **Then**: API response includes **`sourceType`**, **`sourceId`**, snippet boundary suitable for citation in UX.

### A5 — Deletion consistency

- **Given**: Employee terminated and record redacted/deleted under policy.
- **When**: within minutes, search rerun.
- **Then**: terminated employee embeddings absent unless legal retention dictates sealed archive (document exception path).

### A6 — Latency sanity (pgvector MVP)

- **Given**: corpus size N documented per environment tier.
- **When**: KNN query with filters.
- **Then**: **p95** within agreed budget (example: `< 250ms` BFF-origin-DB round trip excluding model encode if remote).

### Manual / periodic

- Spot-check hallucination proxies: unrelated queries must not leak cross-department titles at rate > agreed false-positive threshold.

---

## Escalation to dedicated vector DB

Trigger when pgvector ingest or query violates **latency**, ** cardinality**, **index rebuild windows**, or **multi-region read fan-out** budgets defined in Phase D triggers doc. Migrate only if **dual-write + reconciliation** playbook exists — vectors remain keyed by Postgres IDs.

## References

- Phase A boundaries: [`01-phase-a-core-boundaries.md`](./01-phase-a-core-boundaries.md)
- Wasm/Rust triggers: [`03-wasm-rust-adoption-triggers.md`](./03-wasm-rust-adoption-triggers.md)
