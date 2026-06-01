import { describe, expect, it } from "vitest";

import {
  loadDynamicEnforcementConfig,
  selectInjectProfile,
  markInjectProfile,
  shouldRefreshGovernance,
  hasMaterialLaneGaps,
} from "../../../.cursor/hooks/hook-dynamic.mjs";

describe("hook-dynamic", () => {
  it("defaults dynamic enforcement to enabled with material-gap mode", () => {
    const cfg = loadDynamicEnforcementConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.poInjectEveryN).toBeGreaterThanOrEqual(10);
    expect(cfg.fullInjectOnMaterialGapsOnly).toBe(true);
  });

  it("selects full inject on first prompt or tier change", () => {
    const state = { poInjectCount: 2, pathClass: "docs" };
    expect(selectInjectProfile(state, { tier: "T1", missing: [], requiredLanes: [] })).toBe("full");

    state.lastInjectedTier = "T1";
    state.lastInjectedPathClass = "docs";
    state.lastInjectedCollabPhase = "proposal";
    expect(selectInjectProfile(state, { tier: "T3", missing: [], requiredLanes: [] })).toBe("full");
  });

  it("skips inject on stable tier/path between reminders", () => {
    const state = {
      poInjectCount: 2,
      lastInjectedTier: "T1",
      lastInjectedPathClass: "docs",
      lastInjectedCollabPhase: "proposal",
      pathClass: "docs",
      collaborationPhase: "proposal",
    };
    expect(selectInjectProfile(state, { tier: "T1", missing: [], requiredLanes: [] })).toBe("skip");
  });

  it("uses compact profile on poInjectEveryN boundary", () => {
    const n = loadDynamicEnforcementConfig().poInjectEveryN;
    const state = {
      poInjectCount: n,
      lastInjectedTier: "T1",
      lastInjectedPathClass: "docs",
      lastInjectedCollabPhase: "proposal",
      pathClass: "docs",
      collaborationPhase: "proposal",
    };
    expect(selectInjectProfile(state, { tier: "T1", missing: [], requiredLanes: [] })).toBe("compact");
  });

  it("does not full-inject for non-material planned lane gaps", () => {
    const state = {
      poInjectCount: 2,
      lastInjectedTier: "T1",
      lastInjectedPathClass: "docs",
      lastInjectedCollabPhase: "proposal",
      pathClass: "docs",
      plannedLanes: ["scout", "architect", "builder", "verifier"],
    };
    expect(
      selectInjectProfile(state, {
        tier: "T1",
        missing: ["scout", "architect"],
        requiredLanes: ["verifier"],
      }),
    ).toBe("skip");
  });

  it("full-injects when required lane is missing", () => {
    const state = {
      poInjectCount: 5,
      lastInjectedTier: "T1",
      lastInjectedPathClass: "docs",
      lastInjectedCollabPhase: "proposal",
      pathClass: "docs",
    };
    expect(
      selectInjectProfile(state, {
        tier: "T1",
        missing: ["verifier"],
        requiredLanes: ["verifier"],
      }),
    ).toBe("full");
  });

  it("hasMaterialLaneGaps detects T3 critical lanes", () => {
    expect(
      hasMaterialLaneGaps({
        tier: "T3",
        missing: ["counsel"],
        requiredLanes: ["verifier"],
      }),
    ).toBe(true);
  });

  it("requires refresh when cache fingerprint is stale", () => {
    const state = { governanceCache: { diffFingerprint: "stale-fp" } };
    expect(shouldRefreshGovernance(state, { force: true })).toBe(true);
  });

  it("markInjectProfile records last injected tier", () => {
    const state = { pathClass: "payroll", collaborationPhase: "proposal" };
    markInjectProfile(state, { tier: "T2", profile: "full" });
    expect(state.lastInjectedTier).toBe("T2");
    expect(state.lastInjectedPathClass).toBe("payroll");
  });
});
