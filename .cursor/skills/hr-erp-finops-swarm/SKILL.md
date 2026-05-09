---
name: hr-erp-finops-swarm
description: >-
  Lead FinOps and token-efficiency governance for Cursor multi-agent swarms:
  model-tier defaults for delegated Tasks, ping-pong circuit breakers, mandatory
  FinOps checkpoint notes, and cloud right-sizing checklists. Distinct from
  in-app Inference API budgets (ADR 0001). Use when orchestrating multiple
  Cursor Tasks, auditing swarm cost discipline, or reviewing over-provisioned
  infra proposals.
disable-model-invocation: false
---

# HR ERP FinOps and token efficiency (swarm / Cursor Tasks)

## Who must use this

| Context | Action |
|--------|--------|
| **Orchestrator** spawning **≥2** Cursor **Task** subagents on one feature | Load **`@hr-erp-finops-swarm`** or this file; apply model-tier defaults; emit a **FinOps note** per template below; enforce the **ping-pong circuit breaker**. |
| **Human Lead** cost gate | Attach **`.cursor/rules/agent-finops.mdc`** (`agent-finops`) to the coordinating prompt when FinOps discipline must be explicit. |
| **Product runtime LLM spend** (tenant inference, Tier A/B/C) | Use **`hr-erp-mlops`** + [ADR 0001: SLM-first inference routing](../../../docs/architecture/adrs/0001-slm-first-inference-routing.md)—**not** this skill. |

**Skill identifier:** `hr-erp-finops-swarm` (frontmatter `name`).

## Scope boundary (do not conflate)

- **This skill:** Cursor **agent** orchestration—delegated **Task** model choice, handoff churn, and human-visible swarm discipline. There is **no** repo-local API to meter subagent token burn; use **task-class heuristics**, **checkpoints**, and Cursor **team/account analytics** for evidence.
- **ADR 0001:** In-product **Inference API** tiers, caches, and tenant/global budgets. Engineering changes to that surface follow **`hr-erp-mlops`** and product Architecture—not FinOps swarm rules alone.

## Cursor Task model tiers (defaults)

When the parent agent sets the Task tool **`model`** parameter, prefer tiers that match **task class**. Use only **model slugs the parent Orchestrator is allowed to pass** for Task agents (see issuing environment’s allowed list); if a slug is unavailable, pick the **nearest cheaper** allowed model.

| Tier | Typical task class | Examples |
|------|-------------------|----------|
| **Fast / small** (default for narrow work) | Deterministic edits, single-file fix, lint/format, “run command and paste output”, straightforward test failure triage | Prefer the fastest allowed Task model. |
| **Medium** | Architecture sketches, cross-file refactors with clear boundaries, security-sensitive **design** (not secret handling), compliance-aware test plans | Mid-weight allowed Task model. |
| **Largest** | **Human opt-in only**: ambiguous multi-system production incidents, brief-mandated high-stakes reasoning, novel cross-context ADR conflicts | Do **not** default QA or Implementation Tasks here. |

**Swarm budget behavior:** State **task class** and **model tier** in each delegated Task prompt. If a lane produces **no** mergeable diff and **no** recorded checkpoint artifact after a full pass, **downgrade** to **Fast / small** for the next attempt or **collapse** to a single thread before spending again.

## Ping-pong circuit breaker (agent-to-agent)

**Trip condition:** **Two** full round-trips between the **same two** agent **roles** (e.g. Implementation ↔ QA) **without**:

- a **merge-oriented** artifact (coherent diff or explicit “no code change” with verifier output), **and**
- a **checkpoint** recorded in the PR or parent transcript (PO, FinOps, or lane-specific note).

**On trip:** **Freeze** further delegated Tasks between those two roles. **Do not** restart the ping-pong.

**Escalation — Meta-Reviewer (operational definition):** Run **one** consolidation pass: a **review-focused** Cursor **Task** (e.g. subagent_type **`code-reviewer`**) **or** the Human Lead, with a single deliverable: **merge recommendation** (approve / changes required / abort) plus **commands run** and **diff summary**. **Human** owns merge strategy and final sign-off. **Do not** invent a separate “Meta-Reviewer” agent file unless the repo adds one.

## FinOps note template (≤6 lines)

Paste into the parent transcript or PR when opening **each wave** of delegated Tasks:

```
FinOps: brief/slug ___ | Task count ___ | default tier ___ | loop breaker: clear/tripped |
infra flag: none/spot-serverless-review ___ | ADR0001 N/A (agent-only) ___
```

## Cloud economics checklist (DevOps / infra proposals)

Use when a proposal adds or scales **Kubernetes**, VMs, or always-on compute:

1. **Workload shape:** Steady low QPS **vs** bursty/batch → prefer **minimal steady pools**; use **spot / preemptible** for fault-tolerant batch; use **serverless / job runners** for sporadic background work.
2. **Proof of need:** Require **metrics or load-test** justification before multi-AZ or large node counts.
3. **SLO vs cost:** Document acceptable latency/error tradeoffs when downsizing; do not over-provision for “simple background task” tiers.
4. **Artifact:** If this repo has no cluster manifests, capture decisions in Architecture notes or ADR; **do not** block on rewriting YAML that does not exist here.

## References

- [Orchestrator rule](../../rules/orchestrator.mdc) — sequencing and transcript fidelity.
- [Swarm multi-agent rerun checklist](../../../specs/templates/swarm-multiagent-rerun-checklist.md).
- [ADR 0001 — SLM-first inference routing](../../../docs/architecture/adrs/0001-slm-first-inference-routing.md) — product inference only.
- **`hr-erp-mlops`** — production AI infrastructure and routing.
