import { describe, expect, it } from "vitest";

import { resolveHookMode } from "../../../.cursor/hooks/lib.mjs";

describe("resolveHookMode", () => {
  it("fails closed to enforce when config is missing", () => {
    expect(resolveHookMode({ env: {}, cfg: null })).toBe("enforce");
  });

  it("allows explicit GOVERNANCE_HOOK_MODE=shadow", () => {
    expect(
      resolveHookMode({
        env: { GOVERNANCE_HOOK_MODE: "shadow" },
        cfg: null,
      }),
    ).toBe("shadow");
  });

  it("treats unknown GOVERNANCE_HOOK_MODE as enforce", () => {
    expect(
      resolveHookMode({
        env: { GOVERNANCE_HOOK_MODE: "typo" },
        cfg: null,
      }),
    ).toBe("enforce");
  });

  it("honors enforceAfter even when defaultMode is shadow", () => {
    expect(
      resolveHookMode({
        env: {},
        cfg: { defaultMode: "shadow", enforceAfter: "2020-01-01" },
        now: Date.parse("2026-08-12T00:00:00.000Z"),
      }),
    ).toBe("enforce");
  });

  it("keeps shadow before enforceAfter when defaultMode is shadow", () => {
    expect(
      resolveHookMode({
        env: {},
        cfg: { defaultMode: "shadow", enforceAfter: "2099-01-01" },
        now: Date.parse("2026-08-12T00:00:00.000Z"),
      }),
    ).toBe("shadow");
  });
});
