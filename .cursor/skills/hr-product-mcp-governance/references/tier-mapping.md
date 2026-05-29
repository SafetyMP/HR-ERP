# Tier mapping — do not conflate axes

| Axis | Values | Governs |
|------|--------|---------|
| **Cursor riskTier** | T0–T4 | IDE orchestration, delegated Tasks, PR `riskTier` |
| **productInferenceTier** | A, B, C | In-app LLM routing budgets ([ADR 0001](../../../../docs/architecture/adrs/0001-slm-first-inference-routing.md)) |
| **productMcpToolClass** | `read_internal`, `read_confidential`, `propose_side_effect` | Copilot MCP tool exposure |
| **protect-mcp tool tiers** | 1–4 (community skill) | Cedar policy strictness for **tool calls** at MCP gateway — map loosely: catalog read → 1–2; transport `execute_command` → 3–4 |

## productMcpToolClass ↔ catalog

| Class | `maxDataClassification` | HITL |
|-------|-------------------------|------|
| `read_internal` | `internal` | Not required for read |
| `read_confidential` | `confidential` | Step-up MFA per ABAC |
| `propose_side_effect` | Any + write path | Governance proposal + human approve |

## Cursor lane for copilot diffs

`product_runtime_mcp` path trigger → **T3**, lanes: `ai_governance_reviewer` + `sentinel` (not `mlops_reviewer` alone).
