# Copilot MCP governance (protect-mcp)

Starter Cedar policy and config for **shadow-mode** evaluation at the product MCP transport boundary.

- [`policy.cedar`](./policy.cedar) — allowlist + confidential tool MFA (`principal.mfaLevel`, `resource.maxDataClassification`)
- [`protect-mcp.config.json`](./protect-mcp.config.json) — `mode: shadow` by default

## Transport (Phase 3 scaffold)

Stdio MCP server: [`scripts/copilot-mcp-server.ts`](../../../scripts/copilot-mcp-server.ts)

```bash
# Direct (tools/call requires dev gate)
COPILOT_MCP_ALLOW_STDIO=1 npx tsx scripts/copilot-mcp-server.ts

# Shadow gateway (recommended)
npx protect-mcp --policy lib/copilot/governance/policy.cedar -- env COPILOT_MCP_ALLOW_STDIO=1 npx tsx scripts/copilot-mcp-server.ts
```

CI: `npm run governance:protect-mcp` validates Cedar ↔ catalog alignment.

Enforce rollout: [transport-rollout.md](../../../.cursor/skills/hr-product-mcp-governance/references/transport-rollout.md).

## Accepted residual risk (ALARP compensating controls)

Until enforce + JWT/RLS handlers ship:

| Risk | Compensating control |
|------|---------------------|
| protect-mcp shadow only | CI `governance:protect-mcp`; no production `DATABASE_URL` on stdio server |
| No JWT on stdio MCP | `tools/call` gated by `COPILOT_MCP_ALLOW_STDIO=1`; handlers return `not_implemented` |
| Cedar lacks live principal/tenant | Tool-name allowlist + Zod validation at transport; T3 PR requires `ai_governance_reviewer` lane |
| IDE MCP fail-open removed | `beforeMCPExecution` `failClosed: true`; `.cursor/mcp.json` allowlist |

Do not enable `--enforce` or wire handlers to production DB until staging red-team (see transport-rollout).
