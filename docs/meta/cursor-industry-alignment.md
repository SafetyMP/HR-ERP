# Cursor harness — industry alignment

Maps HR ERP agent governance to published frameworks. Normative ADR: [0016-agent-harness-foundation.md](../../specs/alignment/decisions/0016-agent-harness-foundation.md).

## Framework mapping

| Framework | Production minimum | Harness artifact | Evidence checklist |
|-----------|-------------------|------------------|-------------------|
| **Cordum L3** | Pre-dispatch policy, approval binding, immutable run evidence | Manifest v4 + hooks + handoff | Handoff JSON; `session-lane-state.json`; `.cursor/hooks-output/audit.log` |
| **NIST AI RMF Agentic Profile** | Govern/Map/Measure/Manage; agent inventory | T0–T4 tiers; lane model | Handoff `delegationDepth`, `toolClasses`, `principal` |
| **CSA Autonomy Levels** | Controls outside agent reach | Manifest/hooks/CI control plane | Hooks not writable by agent; CI merge gate |
| **AI-SDLC** | DoR gate, quality gates, no auto-merge main | PO gate, golden thread | PR lane sign-off; no Automations auto-merge T2+ |
| **DevOps S&OP/IBP** | Demand/supply/delivery | `@hr-devops-lifecycle` | PR value-delivery section |

## Compliance posture

Declare in handoff or PR when regulated:

| Posture | Default gate strictness |
|---------|-------------------------|
| `NIST AI RMF` | Standard T3 counsel + sentinel |
| `EU AI Act employment-AI` | HITL + audit retention on AI paths |
| `ISO 42001-ready` | Documented controls + golden thread drill |

## Cordum L3 evidence checklist (T3+)

- [ ] `npm run governance:lint` tier matches PR `riskTier`
- [ ] `specs/**/orchestrator-handoff.json` discovered and `--strict` valid
- [ ] Required lanes present in `delegatedTaskPlan`
- [ ] PO checkpoint filled (brief or `.cursor/plans/*.md` for harness work)
- [ ] Sentinel sign-off in PR golden thread
- [ ] Hook audit log append-only (local IDE sessions)

## Where we exceed typical guidance

- 14 function lanes with DAG validation
- Dual MCP planes (IDE vs product copilot)
- Domain invariants (payroll never mutates Core HR DB) as policy-as-code

## Where to improve (tracked)

- Cloud `beforeMCPExecution` / `stop` hooks (upstream Cursor)
- Real-time agent registry integrated with IAM (future)
- DSSE attestations on lane sign-offs (future AI-SDLC parity)
