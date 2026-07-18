/**
 * Graduated enforcement profiles (balanced | strict).
 * Precedence: GOVERNANCE_ENFORCEMENT_PROFILE > hooks-output file > handoff > hook-mode default.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadHookModeConfig } from "./lib.mjs";
import { findHandoffForCwd } from "../../scripts/governance-handoff-lib.mjs";

export const VALID_PROFILES = ["balanced", "strict"];

export function hooksOutputPath(name) {
  return join(process.cwd(), ".cursor", "hooks-output", name);
}

function readProfileFile() {
  const path = hooksOutputPath("enforcement-profile.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function profileFlags(profileName, cfg) {
  const profiles = cfg?.enforcementProfiles ?? {};
  const def = profiles[profileName] ?? profiles.balanced ?? { stopDenyCriticalLanes: false };
  return {
    stopDenyCriticalLanes: Boolean(def.stopDenyCriticalLanes),
  };
}

/**
 * @returns {{ profile: string, source: string, reason?: string, at?: string }}
 */
export function getEnforcementProfile() {
  const env = process.env.GOVERNANCE_ENFORCEMENT_PROFILE?.trim().toLowerCase();
  if (env && VALID_PROFILES.includes(env)) {
    return { profile: env, source: "env" };
  }

  const fileRec = readProfileFile();
  if (fileRec?.profile && VALID_PROFILES.includes(fileRec.profile)) {
    return {
      profile: fileRec.profile,
      source: fileRec.source ?? "hooks-output",
      reason: fileRec.reason,
      at: fileRec.at,
    };
  }

  const handoff = findHandoffForCwd();
  const rawHandoff = handoff?.data?.enforcementProfile;
  const handoffProfile =
    typeof rawHandoff === "string"
      ? rawHandoff.trim().toLowerCase()
      : typeof rawHandoff === "object" && rawHandoff?.profile
        ? String(rawHandoff.profile).trim().toLowerCase()
        : null;
  if (handoffProfile && VALID_PROFILES.includes(handoffProfile)) {
    return {
      profile: handoffProfile,
      source: "handoff",
      reason: handoff.path.replace(process.cwd() + "/", ""),
    };
  }

  const cfg = loadHookModeConfig();
  const defaultName = cfg?.enforcementProfiles?.default ?? "balanced";
  return {
    profile: VALID_PROFILES.includes(defaultName) ? defaultName : "balanced",
    source: "hook-mode-default",
  };
}

export function getProfileFlags() {
  const cfg = loadHookModeConfig();
  const { profile } = getEnforcementProfile();
  return {
    profile,
    ...profileFlags(profile, cfg),
  };
}
