# HR AI data governance — extended reference

Use this file when the task needs **narrative** policy text without opening every playbook doc. Always prefer **primary** docs under `docs/ai-governance/` for authoritative wording.

## Mandates (product translation)

| Mandate | Implication |
|---------|----------------|
| De-biasing + XAI | Documented data + model limits; ongoing disparity testing where lawful; **structured explanations** tied to inputs/rules, not vague confidence. |
| Data minimization | Purpose-bound **feature allowlists**; justify age, geo, proxies; mask/tokenize; retention + access control. |
| HITL | **No** auto hire / terminate / comp / PIP from model output alone; **human approval + sign-off** + immutable audit + explanation linkage. |

## EU AI Act (engineering framing only)

Employment-related profiling and screening often map to **high-risk** expectations: risk management, data governance, documentation, transparency, **human oversight**, logging, monitoring. **Counsel** confirms classification and obligations per deployment.

## Success criteria (ship-ready AI HR feature)

- Model card + documented features + bias eval evidence (or justified N/A with Legal).
- Stored explanations; HITL approvals; audit events linking decision ↔ model version ↔ explanation ref.
- No API that completes high-stakes employment actions **without** the governed execution path.

## Invoking this skill elsewhere

- **In-repo agents:** `@hr-ai-data-governance` or path `.cursor/skills/hr-ai-data-governance/SKILL.md`.
- **Orchestration:** [`.cursor/rules/orchestrator.mdc`](../../rules/orchestrator.mdc) (`alwaysApply`) sequences this skill conditionally; delegated Tasks also use **agent-ai-governance** (`.cursor/rules/agent-ai-governance.mdc`).
- **Personal Cursor skills dir:** Copy or symlink this folder to `~/.cursor/skills/hr-ai-data-governance/` to use the same playbook outside this repository.
