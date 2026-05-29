---
name: hr-product-mcp-governance
description: >-
  Product-runtime HR copilot MCP: catalog, transport, tenant isolation, HITL,
  hybrid protect-mcp shadow→enforce. Use for lib/copilot, MCP tool additions,
  red-team scenarios. Not Cursor IDE MCP plugins.
risk: critical
minRiskTier: T3
source: project
disable-model-invocation: true
---

# HR product MCP governance

## Use this skill when

- Editing [`lib/copilot/`](../../../lib/copilot/) (catalog, transport, governance config)
- Adding or changing tools in `COPILOT_TOOL_CATALOG`
- Wiring MCP stdio/websocket transport (Phase 3)
- Red-team or audit scenarios for cross-tenant tool calls

## Do not use this skill when

- Configuring **Cursor workspace MCP plugins** (Prisma, Figma, etc.) — use `@protect-mcp-governance` on the IDE plane
- MLOps inference routing only (`docs/ml/`, `services/ml-serving/`) — use `@hr-regulated-domain` mlops L3
- T1/T2 work with no copilot or threat-model surface

## Instructions

1. Read [hr-copilot-mcp.md](../../../docs/architecture/hr-copilot-mcp.md) and [agent-mcp-threat-model.md](../../../docs/security/agent-mcp-threat-model.md).
2. **Catalog:** Zod `inputSchema.parse` before handlers; RBAC `permission` from descriptor; no direct Prisma in handlers — reuse `lib/*` with `AuthContext`.
3. **Identity:** `tenant_id` / `subject_id` only from JWT/session — never from model arguments.
4. **Side effects:** High-stakes mutations via [`lib/governance/`](../../../lib/governance/) proposals + HITL — not raw tool execution.
5. **Hybrid boundary:** Cedar + shadow mode per [transport-rollout.md](references/transport-rollout.md); enforce only after shadow validation.
6. **Tests:** Extend [`tests/unit/copilot/mcp-tools.test.ts`](../../../tests/unit/copilot/mcp-tools.test.ts) — unique names, read permissions, validation, unknown tool denial.
7. Update threat-model review checklist when adding tools.

## Resources

- [references/tier-mapping.md](references/tier-mapping.md)
- [references/transport-rollout.md](references/transport-rollout.md)
- [hr-regulated-domain product-mcp L3](../hr-regulated-domain/references/product-mcp.md)
- Global `@protect-mcp-governance` for Cedar/receipts at transport

## Limitations

- Engineering controls only — not legal advice
- Transport may remain scaffold until Phase 3 exit criteria in [`implementation-sequence.md`](../../../docs/ml/implementation-sequence.md)
