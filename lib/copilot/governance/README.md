# Copilot MCP governance (protect-mcp)

Starter Cedar policy and config for **shadow-mode** evaluation at the product MCP transport boundary.

- [`policy.cedar`](./policy.cedar) — allowlist aligned with `COPILOT_TOOL_CATALOG`
- [`protect-mcp.config.json`](./protect-mcp.config.json) — `mode: shadow` by default

## Transport (Phase 3 scaffold)

Stdio MCP server: [`scripts/copilot-mcp-server.ts`](../../../scripts/copilot-mcp-server.ts)

```bash
# Direct
npx tsx scripts/copilot-mcp-server.ts

# Shadow gateway (recommended)
npx protect-mcp --policy lib/copilot/governance/policy.cedar -- npx tsx scripts/copilot-mcp-server.ts
```

CI: `npm run governance:protect-mcp` validates Cedar ↔ catalog alignment.

Enforce rollout: [transport-rollout.md](../../../.cursor/skills/hr-product-mcp-governance/references/transport-rollout.md).
