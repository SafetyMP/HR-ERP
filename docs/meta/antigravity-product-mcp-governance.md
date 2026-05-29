# Antigravity × HR ERP product-runtime MCP governance

Maps **Google Antigravity 2.0** harness and Enterprise governance primitives to this repo’s **two MCP planes**. Normative split: [ADR 0010](../../specs/alignment/decisions/0010-agent-risk-tier-governance.md). Cursor harness: [cursor-antigravity-harness.md](cursor-antigravity-harness.md).

## Two MCP planes (do not conflate)

| Plane | What | Governed by |
|-------|------|-------------|
| **Cursor IDE** | Workspace MCP plugins (Prisma, Figma, browser, …) | Antigravity-style harness: `allowedPlugins`, `@cursor-harness-scope`, optional `@protect-mcp-governance` hooks |
| **Product runtime** | In-app HR copilot MCP catalog + transport | `@hr-product-mcp-governance`, threat model, RBAC/RLS, hybrid Cedar at [`lib/copilot/governance/`](../../lib/copilot/governance/) |

Changing **both** in one PR: **T3** on the IDE side + product invariants in [agent-mcp-threat-model.md](../security/agent-mcp-threat-model.md).

## Antigravity / Enterprise mapping

| Antigravity / Enterprise | HR ERP hybrid |
|--------------------------|---------------|
| Agent Identity (SPIFFE) | JWT/mTLS [`AuthContext`](../../lib/security/auth-context.ts); model never sets `tenant_id` |
| Agent Gateway | App orchestrator + optional protect-mcp gateway on MCP transport |
| Model Armor / tool policy | Cedar at transport + RBAC allowlist in `COPILOT_TOOL_CATALOG` |
| Shadow → enforce | protect-mcp **shadow by default**; HR policy-engine on data plane |
| Lazy skills / plugin budget | manifest `maxSkillBodies: 3` (v3); sentinel `allowedPlugins: []` |
| MCP config (`~/.gemini/config/mcp_config.json`) | **Not** this repo’s product server — Cursor plugin config only |

## Scope router

Diffs under `lib/copilot/**` elevate to **T3** via manifest `product_runtime_mcp` and require lanes `ai_governance_reviewer` + `sentinel`:

```bash
npm run governance:lint
node scripts/governance-lint.mjs plan
```

## Separate axes (never merge)

| Axis | Values |
|------|--------|
| Cursor **riskTier** | T0–T4 |
| **productInferenceTier** | A, B, C |
| **productMcpToolClass** | `read_internal`, `read_confidential`, `propose_side_effect` |
| protect-mcp tool tiers (IDE/gateway skill) | 1–4 — see [tier-mapping.md](../../.cursor/skills/hr-product-mcp-governance/references/tier-mapping.md) |

## Skills

| Invoke | When |
|--------|------|
| `@hr-product-mcp-governance` | Catalog, transport, copilot governance config |
| `@hr-regulated-domain` | Compliance + AI umbrella (L3 `product-mcp.md`) |
| `@protect-mcp-governance` | Cedar policies, shadow→enforce, receipt verification |
| `@hr-orchestration-lanes` | Lane recipes for copilot diffs |

## References

- [hr-copilot-mcp.md](../architecture/hr-copilot-mcp.md)
- [implementation-sequence.md](../ml/implementation-sequence.md) Phase 3
- [ADR 0011](../../specs/alignment/decisions/0011-function-lane-orchestration.md)
