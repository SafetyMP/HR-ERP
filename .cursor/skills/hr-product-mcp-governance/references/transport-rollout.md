# Product MCP transport — hybrid rollout

## Layers

1. **HR-native (authoritative):** JWT `AuthContext`, `COPILOT_TOOL_CATALOG` allowlist, RBAC/ABAC/RLS, [`lib/governance/`](../../../../lib/governance/) for side effects.
2. **protect-mcp (boundary):** Cedar evaluation + Ed25519 receipts on MCP JSON-RPC — config in [`lib/copilot/governance/`](../../../../lib/copilot/governance/).

## Rollout sequence

| Step | Mode | Action |
|------|------|--------|
| 1 | Shadow | `npx protect-mcp --policy lib/copilot/governance/policy.cedar -- node <mcp-server-entry>` (no `--enforce`) |
| 2 | Review | Inspect shadow log / receipts; align Cedar with catalog tool names |
| 3 | Enforce | Add `--enforce` in staging; red-team cross-tenant call must **fail closed** |
| 4 | Audit | Correlate receipt `correlation_id` with [`lib/governance/audit.ts`](../../../../lib/governance/audit.ts) |

## Follow-up implementation (not blocking catalog PRs)

- Wire stdio/websocket MCP server that calls `getCopilotTool` + handlers
- Per-request scoped tokens (see threat model T1/T2)
- Kill-switch: disable tool plane without core HR CRUD outage

## References

- [`docs/meta/antigravity-product-mcp-governance.md`](../../../../docs/meta/antigravity-product-mcp-governance.md)
- [`protect-mcp.config.json`](../../../../lib/copilot/governance/protect-mcp.config.json)
