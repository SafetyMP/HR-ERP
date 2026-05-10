/**
 * Embedded HR copilot — MCP tool definitions (Phase 3 scaffold).
 *
 * The copilot exposes a *narrow* set of read-only HR tools through an MCP
 * server (see [`docs/security/agent-mcp-threat-model.md`](../../docs/security/agent-mcp-threat-model.md)).
 * Each tool runs through the existing RBAC + ABAC + RLS stack — the copilot is
 * not a privileged actor and never sees data outside the calling tenant.
 *
 * This file is the *catalog* (descriptors). Wiring the descriptors to a real
 * MCP transport (stdio or websocket) is implementation work for a follow-up
 * Task; the catalog lets us unit-test the contract today.
 */

import { z } from "zod";

export interface CopilotToolDescriptor<I, O> {
  name: string;
  description: string;
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  permission: string;
  /** ABAC max classification — confidential tools require step-up MFA. */
  maxDataClassification: "internal" | "confidential";
}

export const GetEmployeeSummaryInput = z.object({
  employeeId: z.string().uuid(),
});
export const GetEmployeeSummaryOutput = z.object({
  employeeId: z.string().uuid(),
  fullName: z.string(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]),
  jobTitle: z.string().nullable(),
  managerId: z.string().uuid().nullable(),
});

export const GetMyPaystubStatusInput = z.object({});
export const GetMyPaystubStatusOutput = z.object({
  hasOpenPaystub: z.boolean(),
  latestPaystubDate: z.string().nullable(),
});

export const GetMyPtoBalanceInput = z.object({});
export const GetMyPtoBalanceOutput = z.object({
  balanceHours: z.string(),
  asOf: z.string(),
});

export const COPILOT_TOOL_CATALOG: CopilotToolDescriptor<unknown, unknown>[] = [
  {
    name: "get_employee_summary",
    description:
      "Return non-confidential summary information for an employee in the calling tenant.",
    inputSchema: GetEmployeeSummaryInput as unknown as z.ZodType<unknown>,
    outputSchema: GetEmployeeSummaryOutput as unknown as z.ZodType<unknown>,
    permission: "employees:read",
    maxDataClassification: "internal",
  },
  {
    name: "get_my_paystub_status",
    description: "Return whether the calling subject has a paystub waiting and its date.",
    inputSchema: GetMyPaystubStatusInput as unknown as z.ZodType<unknown>,
    outputSchema: GetMyPaystubStatusOutput as unknown as z.ZodType<unknown>,
    permission: "paystub:read",
    maxDataClassification: "confidential",
  },
  {
    name: "get_my_pto_balance",
    description: "Return the calling subject's current PTO balance.",
    inputSchema: GetMyPtoBalanceInput as unknown as z.ZodType<unknown>,
    outputSchema: GetMyPtoBalanceOutput as unknown as z.ZodType<unknown>,
    permission: "pto:self_read",
    maxDataClassification: "internal",
  },
];

/**
 * Lookup a tool by name. Returns `undefined` if the tool is not registered.
 * The MCP transport layer should validate the input via `inputSchema.parse`
 * BEFORE invoking the underlying handler; consumers should never trust raw
 * arguments coming from a model.
 */
export function getCopilotTool(
  name: string,
): CopilotToolDescriptor<unknown, unknown> | undefined {
  return COPILOT_TOOL_CATALOG.find((t) => t.name === name);
}
