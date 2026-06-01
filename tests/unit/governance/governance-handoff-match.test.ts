import { describe, expect, it } from "vitest";

import {
  handoffCoversDiff,
  matchGlob,
} from "../../../scripts/governance-handoff-match.mjs";

describe("governance-handoff-match", () => {
  it("matches files under handoff feature directory", () => {
    const handoff = "specs/features/agent-governance-alarp/orchestrator-handoff.json";
    expect(handoffCoversDiff(handoff, ["specs/features/agent-governance-alarp/README.md"])).toBe(
      true,
    );
    expect(handoffCoversDiff(handoff, ["src/app/page.tsx"])).toBe(false);
  });

  it("matches suspectedPaths globs", () => {
    const handoff = "specs/features/foo/orchestrator-handoff.json";
    const data = { suspectedPaths: [".cursor/hooks/**", "scripts/governance-*.mjs"] };
    expect(handoffCoversDiff(handoff, [".cursor/hooks/lib.mjs"], data)).toBe(true);
    expect(handoffCoversDiff(handoff, ["scripts/governance-audit.mjs"], data)).toBe(true);
  });

  it("matchGlob supports ** suffix", () => {
    expect(matchGlob("lib/copilot/foo.ts", "lib/copilot/**")).toBe(true);
    expect(matchGlob("lib/auth/foo.ts", "lib/copilot/**")).toBe(false);
  });
});
