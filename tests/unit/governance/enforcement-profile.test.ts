import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  getEnforcementProfile,
  getProfileFlags,
  VALID_PROFILES,
} from "../../../.cursor/hooks/enforcement-profile.mjs";
import { findHandoffForCwd } from "../../../scripts/governance-handoff-lib.mjs";
import {
  computeBehaviorScore,
  recommendProfile,
} from "../../../scripts/governance-enforcement-profile.mjs";

const outDir = join(process.cwd(), ".cursor", "hooks-output");
const profilePath = join(outDir, "enforcement-profile.json");

describe("enforcement-profile resolver", () => {
  const envBackup = process.env.GOVERNANCE_ENFORCEMENT_PROFILE;

  afterEach(() => {
    if (envBackup === undefined) delete process.env.GOVERNANCE_ENFORCEMENT_PROFILE;
    else process.env.GOVERNANCE_ENFORCEMENT_PROFILE = envBackup;
    if (existsSync(profilePath)) rmSync(profilePath);
  });

  it("defaults to balanced from hook-mode", () => {
    delete process.env.GOVERNANCE_ENFORCEMENT_PROFILE;
    if (existsSync(profilePath)) rmSync(profilePath);
    const r = getEnforcementProfile();
    expect(VALID_PROFILES).toContain(r.profile);
    expect(r.profile).toBe("balanced");
  });

  it("env overrides file and default", () => {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      profilePath,
      JSON.stringify({ profile: "balanced", source: "test" }),
    );
    process.env.GOVERNANCE_ENFORCEMENT_PROFILE = "strict";
    expect(getEnforcementProfile().profile).toBe("strict");
    expect(getEnforcementProfile().source).toBe("env");
  });

  it("file overrides default when env unset", () => {
    delete process.env.GOVERNANCE_ENFORCEMENT_PROFILE;
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      profilePath,
      JSON.stringify({ profile: "strict", source: "L2-promote" }),
    );
    expect(getEnforcementProfile().profile).toBe("strict");
    expect(getEnforcementProfile().source).toBe("L2-promote");
  });

  it("strict profile enables stopDenyCriticalLanes", () => {
    process.env.GOVERNANCE_ENFORCEMENT_PROFILE = "strict";
    expect(getProfileFlags().stopDenyCriticalLanes).toBe(true);
  });

  it("balanced profile disables stop deny", () => {
    delete process.env.GOVERNANCE_ENFORCEMENT_PROFILE;
    if (existsSync(profilePath)) rmSync(profilePath);
    expect(getProfileFlags().stopDenyCriticalLanes).toBe(false);
  });
});

describe("findHandoffForCwd", () => {
  it("finds agent-governance-alarp handoff from feature path", () => {
    const root = process.cwd();
    const handoff = findHandoffForCwd(
      join(root, "specs", "features", "agent-governance-alarp"),
      root,
    );
    expect(handoff?.path).toContain("agent-governance-alarp");
    expect(handoff?.data?.riskTier).toBeDefined();
  });
});

describe("behavior score", () => {
  it("penalizes critical findings and recommends balanced", () => {
    const findings = [
      { id: "pretooluse_never_fired", severity: "critical", message: "x" },
    ];
    const score = computeBehaviorScore({
      findings,
      counts: { stop: 10, subagentStart: 0 },
      state: { completed: [] },
      handoffDiscoverOk: true,
    });
    expect(score).toBeLessThan(80);
    expect(
      recommendProfile({
        behaviorScore: score,
        findings,
        state: { completed: [] },
        graduation: { promoteScoreMin: 80 },
      }),
    ).toBe("balanced");
  });

  it("recommends strict when score high and no critical", () => {
    const findings: { id: string; severity: string; message: string }[] = [];
    const score = computeBehaviorScore({
      findings,
      counts: { stop: 5, subagentStart: 3 },
      state: { completed: [{ function: "counsel" }] },
      handoffDiscoverOk: true,
    });
    expect(score).toBeGreaterThanOrEqual(80);
    expect(
      recommendProfile({
        behaviorScore: score,
        findings,
        state: { completed: [{ function: "counsel" }] },
        graduation: { promoteScoreMin: 80 },
      }),
    ).toBe("strict");
  });
});
