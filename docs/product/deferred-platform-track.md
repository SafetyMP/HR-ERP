# Deferred platform track (not MVP blockers)

**Purpose:** Explicit backlog for **Phase 2 topology** and **AI platform** work that ADRs and ML docs defer until product or operational triggers fire. This is **not** Track A (Feature UAC) closure.

**Phase anchor:** [`specs/alignment/decisions/0001-phase1-scope.md`](../../specs/alignment/decisions/0001-phase1-scope.md) · [`0004-modular-monolith-phase1.md`](../../specs/alignment/decisions/0004-modular-monolith-phase1.md)

---

## Gap analysis reaffirmation (2026-05-18)

Mid-market competitive gap work (**Feature briefs 014–017**, compliance spikes ADR **0005–0007**) **does not** fund Phase 2 below preemptively. Remain on this track until an ADR trigger fires:

| Deferred item | Reaffirmed decision |
| --- | --- |
| PostgreSQL per bounded context | **Wait** — no second deployable service staffed |
| Mandatory Kafka + Schema Registry | **Wait** — no event-volume / SLO breach documented |
| Hardened outbox worker / distroless | **Wait** — no production bus adoption |
| Webhook HTTP delivery worker | **Shipped (Tier 2 P8)** — `lib/webhooks/*`, `npm run worker:webhooks`; fan-out on `enqueueEvent` |
| Connector network I/O | **Wait** — vendor integration RFC |

**Fund instead (Tier 1 product):** UI on existing APIs per [`feature-briefs/014`](./feature-briefs/014-hiring-manager-recruiting-pipeline.md)–[`017`](./feature-briefs/017-employee-learning-self-service.md).

---

## Phase 2 — Data plane and messaging (ADR-triggered)

| Item | Trigger (from ADR) | Scaffold in repo |
| --- | --- | --- |
| PostgreSQL per bounded context (Core HR vs Payroll) | Second deployable service staffed; compliance DB isolation | [`services/core-hr/db/`](../../services/core-hr/db/), [`services/payroll/db/`](../../services/payroll/db/) |
| Mandatory Kafka + Schema Registry | Event volume / SLO breach | [`workers/outbox-publisher/`](../../workers/outbox-publisher/), Compose `architecture` profile |
| Hardened outbox worker (retries, distroless image) | Production bus adoption | ADR [`0003-container-supply-chain.md`](../../specs/alignment/decisions/0003-container-supply-chain.md) follow-ups |
| Webhook HTTP delivery worker | **Done (ADR 0008)** — HTTP drain + fan-out; extend for vendor RFC | [`lib/webhooks/process-pending-deliveries.ts`](../../lib/webhooks/process-pending-deliveries.ts) |
| Connector network I/O | Vendor integration RFC | [`lib/connectors/sdk.ts`](../../lib/connectors/sdk.ts) |

**Until triggered:** Phase1_MVP runs one app + one `DATABASE_URL`; in-process / BullMQ outbox is sufficient.

---

## Innovation layers (architecture phases B–D)

Deferred per [`docs/architecture/01-phase-a-core-boundaries.md`](../architecture/01-phase-a-core-boundaries.md): Edge semantic cache, pgvector search, Wasm/Rust payroll workers, PQC/multimodal clients. Run **`hr-erp-innovation-rd`** parity notes before adopting any of these in product paths.

---

## AI platform ([`docs/ml/implementation-sequence.md`](../ml/implementation-sequence.md))

| Phase | Exit criteria (summary) | Status |
| --- | --- | --- |
| **1 — Inference** | p95 Tier A latency in staging; budget guardrails tested | **Not met** |
| **2 — Predictive + drift** | Shadow scoring; kill-switch dry-run; prediction log + drift jobs | **Partial** (churn demo + docs) |
| **3 — Agents + MCP** | Red-team cross-tenant tool failure; MCP transport wired | **Not met** (catalog in [`lib/copilot/mcp-tools.ts`](../../lib/copilot/mcp-tools.ts)) |

Employee-facing scoring still requires **`hr-ai-data-governance`** + [`docs/ai-governance/`](../ai-governance/) before production.

---

## OSS / supply chain (low urgency)

- Syft SBOM path (ADR 0003)
- Distroless image for `workers/outbox-publisher`
- Vercel OIDC tokenless deploy ([`0002-github-oss-governance-spike.md`](../../specs/alignment/decisions/0002-github-oss-governance-spike.md))

---

## How to use this doc

- **Do not** count these items in Track A UAC % complete.
- **Do** open an ADR or Feature brief when a trigger is hit; link back here and remove or date-stamp the row.
