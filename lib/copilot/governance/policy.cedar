// HR ERP product copilot MCP — Cedar policy (shadow mode default).
// Tool names must match COPILOT_TOOL_CATALOG in lib/copilot/mcp-tools.ts.
// See .cursor/skills/hr-product-mcp-governance/references/transport-rollout.md

permit(
  principal,
  action == Action::"call_tool",
  resource
) when {
  resource.tool_name in [
    "get_employee_summary",
    "get_my_paystub_status",
    "get_my_pto_balance"
  ] &&
  (resource.maxDataClassification != "confidential" ||
   principal.mfaLevel == "step_up")
};

// Deny unknown tools (fail closed when enforce mode is enabled)
forbid(
  principal,
  action == Action::"call_tool",
  resource
) when {
  !(resource.tool_name in [
    "get_employee_summary",
    "get_my_paystub_status",
    "get_my_pto_balance"
  ])
};

// Confidential paystub tool requires step-up MFA at enforce time
forbid(
  principal,
  action == Action::"call_tool",
  resource
) when {
  resource.tool_name == "get_my_paystub_status" &&
  principal.mfaLevel != "step_up"
};
