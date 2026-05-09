# SLOs, pooling, and load-test gates

Principal guidelines for **~100k concurrent product sessions** (not 1:1 DB connections). Tune numbers per environment; record overrides in the feature module proposal.

## Service-level objectives (starting budget)

| Surface | p95 latency | p99 latency | Error budget |
| --- | --- | --- | --- |
| Interactive read API (CRUD / HR UI) | 300 ms | 1 s | < 0.1% 5xx |
| Internal gRPC read (`GetEmployeeSnapshot`) | 50 ms | 200 ms | < 0.05% UNAVAILABLE |
| Command / mutation (REST or async accept) | 500 ms | 2 s | < 0.1% 5xx |
| Payroll batch job (per pay group window) | N/A | Wall-clock SLA defined per tenant tier | Explicit DLQ + alerting |

Document expected **writes per second per aggregate** (e.g. employee patches, punch imports) in the module proposal.

## Connection pooling

- **Never** open one PG connection per user. Size pools per process with \(N_{\text{conn}} \approx \text{TPS}_{\text{db}} \times \text{avg query time}\) per replica, capped by Postgres `max_connections`.
- Separate pools for **OLTP API** vs **batch workers** (payroll compute, outbox relay).
- Set **`statement_timeout`** at role or session level for interactive paths (e.g. 5–30s); batch jobs use a distinct role with higher limits.

## Deadlock and contention posture

- **Fixed lock order** documented per use case in the module proposal (tables listed in deterministic order).
- **Short transactions**: no network I/O inside transactions; compute in app memory or staging tables, then commit state transitions.
- **Optimistic concurrency** on hot rows (`version` column or `updated_at` check).
- **Batch updates** walk primary key or business key **in sorted order** when touching many rows in one job.
- **Dashboards / alerts**: track `deadlocks`, `serialization_failures`, `lock_timeout`, PG `pg_stat_activity` wait events, Kafka consumer lag.

## Load-test gate (before production promotion)

1. Soak test at target **request concurrency** with **pool utilization < 70%** steady-state.
2. Verify **no sustained deadlock rate** (>0 requires investigation + lock-order ADR update).
3. Outbox relay keeps **publish lag** (max `now() - created_at` for unpublished) under agreed threshold.
4. Kafka consumer **lag** bounded per partition key class (employee / tenant).

## References

- ADR [`0001-postgres-kafka-context-boundaries.md`](../../specs/alignment/decisions/0001-postgres-kafka-context-boundaries.md)
- Outbox publisher [`workers/outbox-publisher/README.md`](../../workers/outbox-publisher/README.md)
