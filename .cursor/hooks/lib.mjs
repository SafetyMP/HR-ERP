/**
 * Shared utilities for HR ERP Cursor hooks.
 * GOVERNANCE_HOOK_MODE: shadow (log only) | enforce (deny on violation)
 * Auto-enforces after `.cursor/governance/hook-mode.json` enforceAfter date unless overridden.
 */
import { readFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

function loadHookModeConfig() {
  const path = join(process.cwd(), ".cursor", "governance", "hook-mode.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

export function resolveHookMode() {
  if (process.env.GOVERNANCE_HOOK_MODE) {
    return process.env.GOVERNANCE_HOOK_MODE;
  }
  const cfg = loadHookModeConfig();
  if (!cfg) return "shadow";
  const enforceAfter = cfg.enforceAfter;
  if (enforceAfter && Date.now() >= Date.parse(`${enforceAfter}T00:00:00.000Z`)) {
    return "enforce";
  }
  return cfg.defaultMode ?? "shadow";
}

export const HOOK_MODE = resolveHookMode();

export function readHookInput() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

export function allow(extra = {}) {
  return JSON.stringify({ permission: "allow", ...extra });
}

export function deny(userMessage, agentMessage) {
  return JSON.stringify({
    permission: "deny",
    user_message: userMessage,
    agent_message: agentMessage,
  });
}

export function enforceOrLog(violation, userMessage, agentMessage) {
  logHook(violation, { blocked: true });
  if (HOOK_MODE === "enforce") {
    console.log(deny(userMessage, agentMessage));
    process.exit(2);
  }
  console.log(allow({ hook_note: `[shadow] ${violation}` }));
  process.exit(0);
}

function redactAuditPayload(payload) {
  const out = { ...payload };
  if (typeof out.command === "string") {
    let cmd = out.command.replace(/\/Users\/[^/\s]+/g, "~");
    cmd = cmd.replace(/\/home\/[^/\s]+/g, "~");
    if (cmd.length > 200) cmd = `${cmd.slice(0, 200)}…`;
    out.command = cmd;
  }
  if (typeof out.prompt === "string") {
    out.prompt_length = out.prompt.length;
    delete out.prompt;
  }
  return out;
}

export function logHook(event, payload = {}) {
  const dir = join(process.cwd(), ".cursor", "hooks-output");
  mkdirSync(dir, { recursive: true });
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    mode: HOOK_MODE,
    ...redactAuditPayload(payload),
  });
  appendFileSync(join(dir, "audit.log"), line + "\n");
}

export function loadMcpAllowlist() {
  const path = join(process.cwd(), ".cursor", "mcp.json");
  if (!existsSync(path)) return new Set();
  try {
    const cfg = JSON.parse(readFileSync(path, "utf8"));
    return new Set(Object.keys(cfg.mcpServers ?? {}));
  } catch {
    return new Set();
  }
}

const DESTRUCTIVE_PATTERNS = [
  /\bgit\s+(push\s+--force|push\s+--force-with-lease|reset\s+--hard|clean\s+-fd)\b/,
  /\bgit\s+.*--no-verify\b/,
  /\bprisma\s+migrate\s+reset\b/,
  /\bprisma\s+db\s+(push|execute)\b/,
  /\bdrop\s+(database|schema|table)\b/i,
  /\btruncate\s+table\b/i,
  /\bjwt:dev:demo-[^:]+:vercel\b/,
];

export function isDestructiveShell(command) {
  return DESTRUCTIVE_PATTERNS.some((re) => re.test(command));
}
