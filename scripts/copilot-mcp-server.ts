/**
 * Minimal stdio MCP server for HR ERP product copilot (Phase 3 transport scaffold).
 * Exposes COPILOT_TOOL_CATALOG tools via JSON-RPC over stdin/stdout.
 *
 * Run: npx tsx scripts/copilot-mcp-server.ts
 * Shadow gateway: npx protect-mcp --policy lib/copilot/governance/policy.cedar -- npx tsx scripts/copilot-mcp-server.ts
 */
import { COPILOT_TOOL_CATALOG, getCopilotTool } from "../lib/copilot/mcp-tools";

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
};

function send(msg: unknown) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function toolListResponse(id: number | string | undefined) {
  return {
    jsonrpc: "2.0",
    id,
    result: {
      tools: COPILOT_TOOL_CATALOG.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: {
          type: "object",
          properties: {},
        },
      })),
    },
  };
}

function handleLine(line: string) {
  if (!line.trim()) return;
  let req: JsonRpcRequest;
  try {
    req = JSON.parse(line);
  } catch {
    return;
  }

  if (req.method === "initialize") {
    send({
      jsonrpc: "2.0",
      id: req.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "hr-erp-copilot-mcp", version: "0.1.0" },
      },
    });
    return;
  }

  if (req.method === "tools/list") {
    send(toolListResponse(req.id));
    return;
  }

  if (req.method === "tools/call") {
    const name = (req.params?.name as string) ?? "";
    const tool = getCopilotTool(name);
    if (!tool) {
      send({
        jsonrpc: "2.0",
        id: req.id,
        error: { code: -32602, message: `Unknown tool: ${name}` },
      });
      return;
    }
    send({
      jsonrpc: "2.0",
      id: req.id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "not_implemented",
              tool: name,
              note: "Transport wired; handler delegates to REST/RLS in follow-up.",
            }),
          },
        ],
      },
    });
    return;
  }

  if (req.id !== undefined) {
    send({ jsonrpc: "2.0", id: req.id, result: {} });
  }
}

process.stdin.setEncoding("utf8");
let buffer = "";
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";
  for (const line of lines) handleLine(line);
});

process.stdin.on("end", () => {
  if (buffer.trim()) handleLine(buffer);
});
