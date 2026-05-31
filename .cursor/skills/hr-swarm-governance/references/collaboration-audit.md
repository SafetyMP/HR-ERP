# Collaboration audit (T4 post-mortems)

Principal Systems Auditor: grade **process integrity** and **traceability**, not code style.

## Load first

| Artifact | Purpose |
| --- | --- |
| [specs/templates/golden-thread-trace-table.md](../../../specs/templates/golden-thread-trace-table.md) | PR traceability stub |
| [specs/templates/golden-thread-regulated-payroll-drill.md](../../../specs/templates/golden-thread-regulated-payroll-drill.md) | Full golden thread for pay/time |
| [specs/templates/swarm-multiagent-rerun-checklist.md](../../../specs/templates/swarm-multiagent-rerun-checklist.md) | Remediate rubric-A decomposition |
| [docs/meta/agent-team-map.md](../../../docs/meta/agent-team-map.md) | Lane roster |

## Audit sections

1. **Scope & provenance** — Transcript / PR / slug; single-thread vs delegated Tasks.
2. **Communication audit** — Brief path, PO checkpoint, ADRs on Tasks; additive vs hallucinated scope.
3. **Golden thread** — Legal → `@hr-regulated-domain` → payroll kernel → QA UAC.
4. **Efficiency / loops** — Terminal cycles, migration thrash; evidence-based only.
5. **Innovation vs stability** — `@hr-domain-boundaries` innovation-gate when stack proposals apply.
6. **Dual grades** — Swarm choreography fidelity / episode delivery integrity.
7. **Collaboration heatmap** — Mermaid or matrix grounded in transcript.
8. **System tuning** — Concrete rule/skill fixes; ADR for new bullets.

## Closing rule

Never fabricate coordination the logs do not show. Prefer honest low choreography score over a deceptive multi-expert façade.
