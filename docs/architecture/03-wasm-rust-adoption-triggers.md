# Wasm / Rust Adoption — Triggers & Gates

Advanced runtimes ship only when **measured bottleneck + operational maturity** outweigh **inventory + onboarding cost**. Anything touching **payroll correctness** stays server-authoritative with existing language primitives until barred by legal review.

## 1 — When to introduce **WebAssembly** (browser)

Wasm is constrained to **sandboxed, deterministic previews** aligned with Phase A payroll rules (`01-phase-a-core-boundaries.md`).

### Entry triggers (all SHOULD be true)

| Trigger | Evidence |
|---------|----------|
| **CPU profile** shows ≥ ~30% main-thread time on a reproducible UX path (solver, planner grid) averaged over audited sessions |
| Payload is **deterministic**: same inputs → same outputs cross-browser |
| Sensitive data minimized (prefer anonymized IDs or server-stripped fixtures) |

### Hard gates before merge

- [ ] **`cargo vet` / supply-chain audit** equivalent or vendored semver policy for Wasm crate deps
- [ ] **Pinned toolchain** documented in README; CI builds Wasm from reproducible Dockerfile or lockfile matrix
- [ ] **Golden vector tests**: fixed inputs vs reference outputs (+ edge cases documented)
- [ ] **Sandbox contract**: Wasm cannot access network/storage except via explicitly passed host adapters
- [ ] **Rollback story**: toggle falls back to server-side endpoint or degraded UX inside one release

### Auto-reject

- Wasm generates **authority** payroll numbers without server recompute
- Depends on nightly-only language features blocked by employer security scanners
- **Non-deterministic floats** differing across SIMD without tolerant comparison tests

---

## 2 — When to extract **Rust** services / workers

Rust is justified for **bounded CPU hotspots** typically IO-light and allocation-heavy (parsers, embeddings batch pre/post, matching engines).

### Entry triggers — technical (minimum one HARD + sustained trend)

| Class | HARD criteria example |
|-------|-----------------------|
| **Latency** | p99 origin handler > SLA (e.g. 800 ms) attributable to hotspot with ≥ 25% cumulative CPU exclusive time in profiles |
| **Cost** | Projected infra savings > staffing + paging burden (document TCO worksheet) |
| **Safety/Sandbox** | Memory-safety exploits surface on existing parser pathway (external audit or fuzz crash cluster) |

**Sustained trend**: reproducible weekly for ≥ 3 profiling windows unrelated to outages.

### Hard gates before production cutover

| Gate | Requirement |
|------|-------------|
| Observability | OpenTelemetry spans + RED metrics parity with originating service |
| Contract tests | protobuf/JSON schemas versioned + consumer-driven contract suite |
| SLO rehearsal | Chaos / load test proves bounded queue backlog under 2× expected peak |
| Security | FFI boundary reviewed; forbid `unsafe` except allowlisted crates with rationale |
| Data plane | Stateless workers reading/writing Postgres via pooled connections — **no** split brain dual writes without reconciliation job |

### Rollback thresholds (automatic hold / revert)

| Signal | Threshold (tune per org) |
|--------|-----------------------------|
| Error rate spike | > 5× baseline for ≥ 15m after deploy |
| p99 latency regression | > 20% worsening sustained 1h versus previous week median |
| Data mismatch | reconciliation job detects > 0 mismatched ledger rows |

### Auto-block extraction

Hotspot unresolved by **better SQL/indexing**/async offload in same runtime

Services **< ~500 LOC** boundary with trivial CPU — operational tax dominates

Rust service would duplicate **already correct** Postgres constraints without team capacity to observe distributed failures

---

## 3 — Review cadence

- **Quarterly**: revisit triggers with production profiles; downgrade unnecessary Rust/Wasm paths if hotspots moved.
- **Post-incident**: if rollback fired, freeze new Wasm/Rust features until RCA merged.

---

## References

- [`01-phase-a-core-boundaries.md`](./01-phase-a-core-boundaries.md)
- [`02-phase-bc-edge-semantic-search.md`](./02-phase-bc-edge-semantic-search.md)
