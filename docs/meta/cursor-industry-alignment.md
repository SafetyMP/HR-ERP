# Cursor harness — industry alignment

Maps HR ERP agent governance to published frameworks. Normative ADRs: [0016](../../specs/alignment/decisions/0016-agent-harness-foundation.md), [0017](../../specs/alignment/decisions/0017-reflective-governance-fabric.md), [0018](../../specs/alignment/decisions/0018-dmaic-pdca-adaptation-methodology.md), [0019](../../specs/alignment/decisions/0019-harness-phase2-evidence-adaptation-runtime.md).

## Framework mapping

| Framework | Production minimum | Harness artifact | Evidence checklist |
|-----------|-------------------|------------------|-------------------|
| **Cordum L3** | Pre-dispatch policy, approval binding, immutable run evidence | Manifest v4 + hooks + handoff + evidence bundle | Handoff JSON; evidence bundle hash; lane sign-offs; audit.log |
| **NIST AI RMF Agentic Profile** | Govern/Map/Measure/Manage; agent inventory | T0–T4 tiers; lane model | Handoff `delegationDepth`, `toolClasses`, `principal` |
| **CSA Autonomy Levels** | Controls outside agent reach | Manifest/hooks/CI control plane | Hooks not writable by agent; CI merge gate |
| **AI-SDLC** | DoR gate, quality gates, no auto-merge main | PO gate, golden thread | PR lane sign-off; no Automations auto-merge T2+ |
| **DevOps S&OP/IBP** | Demand/supply/delivery | `@hr-devops-lifecycle` | PR value-delivery section (**strict T1+**); S&OP cycle ID on handoffs |
| **ISO 42001 improvement** | Measure/Manage feedback loop | **Adaptation plane (RGF)** + DMAIC/PDCA | `governance:reflect`; CTQ tree; control plans; `governance:improve` |
| **Collaboration (Harness HITL)** | Architectural human oversight before specialized tools | Collaboration plane + hooks | `collaborationPlan`; `revalidationConfirmed`; phase-7 output review |

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
- [ ] Harness delta in PR when new ledger friction (`signal_id`)
- [ ] T3+ evidence bundle verified (`npm run governance:evidence`)
- [ ] T1+ value-delivery-record linked (strict `pr-body --strict`)
- [ ] Collaboration plan or `.cursor/plans/*.md` with decision overview (T1+)
- [ ] T3+ `revalidationConfirmed` and `humanDecisionRecord.principal` in handoff
- [ ] Phase 7 `outputReviewPassed` or verifier sign-off (T3+ strict)

## Where we exceed typical guidance

- 14 function lanes with DAG validation
- Dual MCP planes (IDE vs product copilot)
- Domain invariants (payroll never mutates Core HR DB) as policy-as-code
- **Fourth Adaptation plane** — learning ledger + L1/L2 promotion without agent self-modification
- **Fifth Collaboration plane** — seven-phase Harness HITL with action-class gates ([ADR 0020](../../specs/alignment/decisions/0020-collaboration-plane-harness-hitl.md))
- **DMAIC/PDCA inside Adaptation** — CTQ drilldown, improvement charters, baselines, control plans ([ADR 0018](../../specs/alignment/decisions/0018-dmaic-pdca-adaptation-methodology.md))

## Where to improve (tracked)

- Cloud `beforeMCPExecution` / `stop` hooks (upstream Cursor) — CI + `governance:cloud-session` shim
- Real-time agent registry integrated with IAM (future)
- DSSE Ed25519 on evidence bundles (Phase 1C; v1 uses SHA-256 hashes per ADR 0019)

See [governance-continuous-learning.md](governance-continuous-learning.md).
