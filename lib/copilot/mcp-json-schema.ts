import { z } from "zod";

/** JSON Schema for MCP tools/list from Zod input schemas. */
export function zodToMcpInputSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema);
}
