import { describe, expect, it } from "vitest";

import {
  loadDynamicEnforcementConfig,
  selectInjectProfile,
  markInjectProfile,
  shouldRefreshGovernance,
} from "../../../.cursor/hooks/hook-dynamic.mjs";

describe("hook-dynamic", () => {
  it("defaults dynamic enforcement to enabled", () => {
    const cfg = loadDynamicEnforcementConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.poInjectEveryN).toBeGreaterThan(0);
  });

  it("selects full inject on first prompt or tier change", () => {
    const state = { poInjectCount: 2, pathClass: "docs" };
    expect(selectInjectProfile(state, { tier: "T1", missing: [] })).toBe("full");

    state.lastInjectedTier = "T1";
    state.lastInjectedPathClass = "docs";
    state.lastInjectedCollabPhase = "proposal";
    expect(selectInjectProfile(state, { tier: "T3", missing: [] })).toBe("full");
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
    expect(selectInjectProfile(state, { tier: "T1", missing: [] })).toBe("skip");
  });

  it("uses compact profile on poInjectEveryN boundary", () => {
    const state = {
      poInjectCount: 5,
      lastInjectedTier: "T1",
      lastInjectedPathClass: "docs",
      lastInjectedCollabPhase: "proposal",
      pathClass: "docs",
      collaborationPhase: "proposal",
    };
    expect(selectInjectProfile(state, { tier: "T1", missing: [] })).toBe("compact");
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
