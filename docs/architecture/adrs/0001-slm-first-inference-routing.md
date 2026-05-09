# ADR 0001: SLM-first inference routing and budget guardrails

| Field | Value |
|--------|--------|
| Status | Accepted |
| Date | 2026-05-09 |
| Deciders | MLOps / Architecture |

## Context

The HR ERP will embed generative and predictive AI. Uncontrolled use of large language models (LLMs) creates **unpredictable cost**, **latency regressions**, and **unnecessary third-party data exposure**. Most high-volume HR interactions (policy lookup, intent routing, field extraction, FAQ-style answers) are **narrow tasks** that specialized small language models (SLMs) or small general models can handle.

We need a single internal abstraction (**Inference API**) so product code does not hard-code provider or model IDs, and we need **governance knobs** (routing, rate limits, degradation) that Architecture and Product can reason about.

## Decision

1. **Default to Tier A (SLM / small model)** for all chat and text completion unless routing logic selects a higher tier.
2. Expose all model calls through an **Inference API** that implements **tier selection**, **tenant-scoped caching**, **logging**, and **budget enforcement**.
3. **Tier definitions** (logical names map to concrete model IDs in deployment config, not in app source):

| Tier | Role | Typical use cases | When to use |
|------|------|-------------------|-------------|
| **A** | SLM / small | Policy Q&A, benefits lookup, intent classification, lightweight extraction, FAQ routing, short summarization | Default |
| **B** | Mid general LLM | Ambiguous questions, multi-step explanations, tone-sensitive drafts | Router confidence below threshold or explicit “deep” mode |
| **C** | Large / frontier | Rare executive synthesis, complex reasoning over weakly structured bundles | Explicit product flag + approval path; never automatic default |

4. **Router:** Combine (a) **allowlist rules** (e.g. “summarize thread” → Tier B if tokens &gt; N), (b) a **lightweight classifier** (Tier A model or dedicated intent classifier) producing tier recommendation + confidence, (c) **user/session hints** (e.g. “detailed analysis” toggles Tier B minimum). If classifier confidence for “Tier A sufficient” is **below 0.82**, escalate to Tier B unless the request is strictly retrieval-only with cached RAG hits.

5. **Budget guardrails:**

   - **Per-tenant** soft cap: default **150k output tokens / calendar day** for Tier B+C combined; hard cap **300k** (returns structured degradation response).
   - **Global** circuit breaker: if rolling 1h spend exceeds **budget alert threshold**, force Tier A + cached answers only until cleared by on-call.
   - **Per-session** cap: **8k output tokens** for Tier B+C combined; further output uses Tier A summarization or “continue in new session” UX.
   - **Rate limits:** default **60 inference requests / minute / tenant** (burst 120); bulk scoring uses separate queue and does not consume interactive limits.

6. **Degradation path:** On provider errors, budget exceedance, or circuit breaker — serve **Tier A** if available, else **templated fallback** (“I can’t reach the AI service; here’s the link to the policy library”) — **do not** fail open to Tier C.

7. **Caching:** Semantic + exact cache keys are **tenant-scoped** and include **content version** (e.g. handbook `etag` or policy bundle hash) to avoid stale legal/HR answers.

## Inference SLOs (initial targets)

These are **product-facing** targets for the Inference API; refine with measured baselines after launch.

| Tier | p95 latency (chat turn) | Monthly error budget (5xx + timeout) | Availability note |
|------|-------------------------|-------------------------------------|-------------------|
| A | ≤ 1.2s | 0.5% | Highest |
| B | ≤ 4s | 0.5% | Standard |
| C | ≤ 25s | 1% | Best-effort; async preferred |

**Cost SLOs (finance planning, not runtime throttle defaults):** enterprise list price planning assumes **≥ 85%** of generative inference token volume on Tier A within six months of GA; Architecture reviews quarterly.

## Consequences

**Positive:** Predictable spend, lower latency for common paths, smaller compliance surface for raw prompts on frontier models.

**Negative:** Router and cache infrastructure to build and operate; occasional under-escalation (user gets Tier A when they wanted depth) mitigated by explicit “more detail” UX.

**Follow-ups:** Implement Inference API service; wire telemetry for tier mix and cost per tenant; review thresholds after 30 days of production traffic.

## References

- [Prediction logging and drift](../../ml/prediction-logging-and-drift.md)
- [Agent and MCP threat model](../../security/agent-mcp-threat-model.md)
- [Implementation sequence](../../ml/implementation-sequence.md)
