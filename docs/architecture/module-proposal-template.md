# Module proposal — `<module name>`

**Author:**  
**Date:**  
**Feature brief link:**  
**Status:** Draft | Review | Approved

Complete all sections before implementation. Attach diagrams (ERD, sequence) as images or Mermaid in `specs/` if needed.

---

## 1. Bounded context decision

- **Context name:** (e.g. Core HR, Payroll, Time & Labor)
- **New deployable service required?** Yes / No  
  - If **No**: justify co-location (team, release cadence, blast radius) and document **future extraction** triggers.
- **Aggregate roots owned:** (bullet list)
- **Integrations:**
  - **Publishes** (events):  
  - **Subscribes** (events):  
  - **Synchronous reads** (REST/gRPC callers or callees):  
- **Forbidden:** any direct DML against another context’s database (state explicitly).

---

## 2. Physical database schema (PostgreSQL)

**Database instance:** `core_hr` | `payroll` | `other: ___` (one writer service per DB)

### 2.1 Tables

| Table | Purpose | PK | Notes |
| --- | --- | --- | --- |

### 2.2 Foreign keys

List **only** FKs where both tables live in **this** database. Cross-context references use columns like `employee_id` (UUID) **without** FK to another database.

| Child table | FK | Parent | On delete |
| --- | --- | --- | --- |

### 2.3 Indexes (query-driven)

| Index | Table | Columns | Partial WHERE | Rationale (query / plan) |
| --- | --- | --- | --- | --- |

### 2.4 Concurrency & effective dating

- Optimistic version column(s):  
- Effective-dated rows (if any):  
- Advisory lock / lease strategy (if any): **none** | describe  

### 2.5 Lock acquisition order (deadlock prevention)

For each multi-statement transaction that touches >1 table, document **strict** order (e.g. `pay_run` → `pay_line` → `deduction_application`):

| Use case / handler | Tables in lock order |
| --- | --- |

---

## 3. Synchronous API contracts

- **REST OpenAPI path:** `contracts/openapi/<name>-v1.yaml` (link)  
- **gRPC/protobuf path:** `contracts/proto/...` (link)  
- **Versioning:** `/v1` or package `hr.<context>.v1`  
- **Idempotency:** header / metadata key for mutations:  
- **Error model:** RFC 7807 problem+json (REST) / gRPC status mapping  
- **Pagination:** cursor / offset policy:  

---

## 4. Async contracts (Kafka)

- **Outbox:** owned by same service as the aggregate; transactional outbox table in **same** DB as domain rows.
- **Topics (facts/commands):**

| Topic name | Schema (registry) | Partition key | Compaction | Consumers / group IDs |
| --- | --- | --- | --- | --- |

- **Envelope:** include `event_id`, `tenant_id`, `aggregate_type`, `aggregate_id`, `occurred_at`, `schema_version` (Protobuf field numbers or Avro union version).
- **Idempotent consumption:** dedupe store or safe replays documented.

---

## 5. Migration & rollout

- Forward-only migrations file list:  
- Backfill strategy (if any):  
- Feature flags / tenant allowlist:  

---

## 6. Risks & scale

| Risk | Mitigation |
| --- | --- |
| e.g. lock contention on pay run | shorter tx, batch ordering, lease row |

**Load assumptions:** concurrent interactive users, batch windows, expected write QPS per aggregate.

---

## Approvals

| Role | Name | Date |
| --- | --- | --- |
| Principal Architect | | |
| Security | | |
| Owner team | | |
