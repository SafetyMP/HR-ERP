# Embedded HR copilot — MCP server architecture

> Phase 3 scaffold. Tool catalog lives in
> [`lib/copilot/mcp-tools.ts`](../../lib/copilot/mcp-tools.ts); read it
> alongside [`docs/security/agent-mcp-threat-model.md`](../security/agent-mcp-threat-model.md).
> Counsel + AI governance must approve any addition to the catalog before
> exposure to a user-facing assistant.

## Why an MCP boundary

Customers want a chat-like assistant that can answer "where's my paystub?"
or "open a manager goal for me", but inviting an LLM to read raw HR data is a
non-starter for compliance. The Model Context Protocol (MCP) gives us a
narrow, typed boundary:

* The model only sees the *tools* the host exposes — not the database schema.
* Each tool runs as **the calling user**, not the model. RBAC, ABAC, and RLS
  remain the source of truth.
* Inputs are validated by Zod (`inputSchema.parse`) **before** the underlying
  handler runs; outputs are likewise constrained.
* Long-running side effects (e.g. open a goal) are gated by the existing
  governance proposal flow (`AiDecisionProposal`) — the copilot proposes,
  HR approves.

## Server topology

```
┌──────────────────┐    MCP (stdio or websocket)    ┌──────────────────┐
│ Cursor / IDE /   │ ─────────────────────────────▶ │ HR ERP MCP server │
│ employee chatbot │                                │ (lives in app)    │
└──────────────────┘                                └──────────────────┘
                                                              │
                                                              ▼
                                                    ┌──────────────────┐
                                                    │ HR ERP REST API  │
                                                    │ (auth+RLS)       │
                                                    └──────────────────┘
```

The MCP server runs **inside** the HR ERP application process. It does not
hold its own credentials — the calling user provides a JWT, exactly as for
the REST API, and every tool call is forwarded to the existing route stack
(or to the corresponding `lib/*` function with the same auth context).

## Catalog contract

Every entry implements `CopilotToolDescriptor<I, O>`:

| Field | Purpose |
| --- | --- |
| `name` | Stable id the model sees (snake_case). |
| `description` | What the tool does — the model may use this verbatim. |
| `inputSchema` | Zod schema applied **before** the handler runs. |
| `outputSchema` | Zod schema applied **after** the handler — never returns extra fields. |
| `permission` | RBAC permission required to invoke the tool. |
| `maxDataClassification` | ABAC ceiling — `confidential` requires step-up MFA. |

## Adding a new tool — checklist

1. Add a Zod input + output schema next to the existing ones.
2. Append a `CopilotToolDescriptor` to `COPILOT_TOOL_CATALOG`.
3. Wire the descriptor to the underlying handler — reuse the same
   `lib/*` function the REST route calls; never call Prisma directly.
4. Add a unit test covering: (a) input validation, (b) RBAC denial, and
   (c) ABAC denial when classification is `confidential`.
5. Add an entry to [`docs/security/agent-mcp-threat-model.md`](../security/agent-mcp-threat-model.md)
   describing the worst-case impact of misuse.
6. AI governance reviews per [`docs/ai-governance/`](../ai-governance/).

## What the copilot **must not** do

* Mutate compensation, hire/terminate, or any high-risk action without an
  HITL-approved governance proposal — even if a tool exists for the
  underlying entity.
* Cross tenant boundaries — the tenant id is taken from the auth context,
  never from the model's arguments.
* Echo PII in its system prompt or persist conversation transcripts that
  contain PII without redaction.
* Receive raw payroll computation outputs — surface only summaries + status,
  let users open the source UI for the full breakdown.
