---
name: hr-erp-mlops
description: >-
  Guides MLOps and AI infrastructure for multi-tenant HR ERPs—SLM-first inference
  economics, predictive model drift monitoring (e.g. flight risk), secure agent
  orchestration and MCP isolation. Use when deploying AI to production, optimizing
  LLM cost/latency, designing inference routing, implementing prediction logs
  and drift alerts, threat-modeling agents/MCP, tenant-scoped caching, or phased
  AI platform rollouts in HR or people-analytics systems.
disable-model-invocation: false
---

# HR ERP MLOps and AI infrastructure

## Workspace grounding

Before citing paths, scripts, APIs, or dependencies for **this repo**, apply [workspace grounding](../README.md) against the active checkout—use Read/Grep (or search), not training-data defaults.

## When to load

Apply this skill for **production AI** in **multi-tenant HR** contexts: generative assistants, predictive analytics (attrition/flight risk, engagement), and **multi-agent** tool use (MCP, HRIS, DB).

## Operating principles

1. **Inference economics:** Default to **Tier A (SLM / small)** for narrow HR tasks; escalate to mid (B) or large (C) only via a **router** (rules + lightweight classifier + confidence). Never let product code hard-code provider model IDs—use one internal **Inference API**.
2. **Caching:** Tenant-scoped semantic + exact cache; keys must include **content/version** (policy bundle hash) so answers do not go stale after handbook updates.
3. **Degradation:** On errors or budget exceedance, degrade to **Tier A or templated fallback**—do **not** fail open to the largest model.
4. **Drift:** Log every predictive score with **model_id**, **feature_set_version**, and a **canonical features digest** (not raw PHI in logs). Monitor PSI, output decile mass shift, null rates, segment hot-spots; wire **warn / page / kill-switch** with rollback to prior artifact or rules.
5. **Agents / MCP:** **AuthContext (JWT/mTLS)** is the only source of `tenant_id` / scopes. Tool calls use **per-request scoped credentials**; **tool allowlists** per agent role; **sandbox** tool-heavy workers; audit **tool name + args_digest + outcome** (no secrets).

## Router (starter thresholds)

- If “Tier A sufficient” classifier confidence **≥ 0.82**, use Tier A unless rules force B (e.g. very long context / explicit “deep analysis”).
- Below that threshold, use **Tier B** unless the request is strictly cache/RAG-hit retrieval.

Tune after production telemetry; do not treat 0.82 as immutable.

## Budget guardrails (starter defaults)

- Per-tenant soft cap **150k** output tokens/day (B+C); hard cap **300k** with structured degradation.
- Per-session cap **8k** output tokens (B+C); then summarize with A or segment the session.
- Interactive rate limit baseline **60 req/min/tenant** (burst 120); **bulk scoring** on a separate queue.

## Predictive log (minimum fields)

- `prediction_id`, `occurred_at`, `tenant_id`, `model_id`, `model_artifact_hash`, `feature_set_version`, `features_digest`, `features_null_rate`, `score`, optional `segment_keys` (json), `inference_path` (`batch` | `realtime` | `shadow`).

## Drift alerts (starter bands)

- **PSI** > 0.25 warn; > 0.35 page. **Top-decile inflation** +40% vs baseline in 24h → page. **Schema/contract** breakage → kill-switch.

## Phased rollout

1. **Inference API** + router + logging + tenant cache + budget enforcement.  
2. **Feature contract** + scoring + prediction warehouse + drift jobs + alerting.  
3. **Orchestrator** + sandboxed workers + MCP with scoped tokens + audit.

## Orchestrator and delegated Task agents

The **Orchestrator** rule [`.cursor/rules/orchestrator.mdc`](../../rules/orchestrator.mdc) requires **`hr-erp-mlops`** when sequencing work that changes inference, scoring, drift observability, RAG serving economics, MCP, or product agent tool sandboxes. For Cursor **Task** subagents doing that work, attach this **SKILL.md** and the **agent-mlops** rule (`.cursor/rules/agent-mlops.mdc`) so tiering, budgets, prediction logs, and tenant-scoped MCP constraints are binding.

When the same work touches **high-risk HR AI** (scoring, screening, governance APIs), also attach **`hr-ai-data-governance`** on that Task ([`.cursor/skills/hr-ai-data-governance/SKILL.md`](../hr-ai-data-governance/SKILL.md))—see “Coordination” there.

## Canonical docs in this repository

Read for ADR-level detail and exact tables:

- [docs/ml/README.md](../../../docs/ml/README.md)
- [docs/architecture/adrs/0001-slm-first-inference-routing.md](../../../docs/architecture/adrs/0001-slm-first-inference-routing.md)
- [docs/ml/prediction-logging-and-drift.md](../../../docs/ml/prediction-logging-and-drift.md)
- [docs/security/agent-mcp-threat-model.md](../../../docs/security/agent-mcp-threat-model.md)
- [docs/ml/implementation-sequence.md](../../../docs/ml/implementation-sequence.md)

If you are in another workspace without this tree, use this SKILL as the standing architecture; copy these docs in when formalizing the product.

## Additional reference

For checklist depth, edge cases, and diagrams, see [reference.md](reference.md).
