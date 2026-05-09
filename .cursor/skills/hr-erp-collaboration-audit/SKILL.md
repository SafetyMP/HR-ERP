---
name: hr-erp-collaboration-audit
description: >-
  Guides Principal Systems Auditor-style post-mortems on how Cursor / Task
  agents collaborated: transcript context sufficiency, hallucination vs Human
  spec, Legal→compliance→payroll-kernel→QA golden thread, friction loops,
  Innovation vs stability tradeoffs, dual grades, collaboration heatmaps,
  and actionable prompt tuning. Invoke when the user asks for swarm or
  orchestration collaboration audit, retrospective, multi-agent post-mortem,
  or "Principal Systems Auditor"; when reviewing delegation vs single-thread
  execution; or after a feature marked complete to score choreography integrity.
---

# HR ERP — Collaboration & swarm audit (repo skill)

Operate as **Principal Systems Auditor**: grade **process integrity** and **traceability**, not code style. Be honest when transcripts show a **single heroic thread** rather than fully delegated specialists.

## Load first (canonical artifacts)

| Artifact | Purpose |
| --- | --- |
| [docs/meta/collaboration-post-mortem-transcript-49235615.md](../../../docs/meta/collaboration-post-mortem-transcript-49235615.md) | Reference **worked example** (one security episode; scores and heatmaps—copy structure, not conclusions) |
| [specs/templates/golden-thread-trace-table.md](../../../specs/templates/golden-thread-trace-table.md) | PR **traceability stub** (all scopes; N/A columns allowed with justification) |
| [specs/templates/golden-thread-regulated-payroll-drill.md](../../../specs/templates/golden-thread-regulated-payroll-drill.md) | Full **golden thread** when pay/time/kernel math applies |
| [specs/templates/swarm-multiagent-rerun-checklist.md](../../../specs/templates/swarm-multiagent-rerun-checklist.md) | **Remediate** rubric-A: explicit Task decomposition + PO pinning |
| [.cursor/rules/orchestrator.mdc](../../rules/orchestrator.mdc) | **Transcript fidelity** bullets (__1__–__7__) + PO gate __1__ |

## Audit sections (output template)

1. **Scope & provenance** — Which transcript / PR / slug; single-thread vs delegated `Task` payloads; what the episode *is* vs *is not*.
2. **Communication audit** — Orchestrator context (brief path, PO checkpoint, ADRs on Tasks); additive vs hallucinated scope; world-model drift (e.g., “empty workspace” vs scaffold).
3. **Golden thread** — Legal → [`hr-backend-compliance`](../hr-backend-compliance/SKILL.md) → [`hr-payroll-calculation-engine`](../hr-payroll-calculation-engine/SKILL.md) → QA UAC. If lanes **N/A**, cite **absent choreography**, not a phantom “leak” persona.
4. **Efficiency / loops** — Count terminal/dep cycles, migration thrash, repeated Human blocks; **do not** invent Backend↔Janitor wars without evidence.
5. **Innovation vs stability** — Cite whether `hr-erp-innovation-rd` parity or **observability tradeoffs** (Spectral-class tooling removal) were addressed.
6. **Dual grades** — e.g. **Swarm choreography fidelity** / **Episode delivery integrity**; publish both when rubrics conflict.
7. **Collaboration heatmap** — Mermaid or matrix: hot / cold pairs grounded in transcript.
8. **System tuning** — Point to concrete repo rules/skills already encoding fixes; add new bullets only via ADR or orchestrator change with Human approval.

## Closing rule (integrity)

**Never** fabricate coordination between agents that the logs do not show. Prefer a **low choreography score** plus an honest narrative over a deceptive “sixteen-expert” façade.

## Coordination

- **Orchestrator:** retrospective / “audit this run” requests should load this skill (see **bullet __8__**, *Collaboration choreography audit*, in [.cursor/rules/orchestrator.mdc](../../rules/orchestrator.mdc)).
- **Peer skills:** combine with **`hr-product-owner`** when mapping findings back to UAC gaps; with **`hr-backend-compliance`** / **`hr-payroll-calculation-engine`** when evaluating whether golden vectors were required but missing.

## Global reuse (other workspaces)

Copy or symlink this folder to `~/.cursor/skills/hr-erp-collaboration-audit/` and align paths to that repo’s orchestration docs.
