import { describe, expect, it } from "vitest";

import {
  decideIgnoredBuild,
  DEFAULT_REQUIRED_CHECK_NEEDLES,
} from "../../../scripts/lib/vercel-ignored-build-core.mjs";

describe("decideIgnoredBuild", () => {
  const base = {
    sha: "abc123",
    token: "tok",
    repository: "SafetyMP/HR-ERP",
    requiredNeedles: DEFAULT_REQUIRED_CHECK_NEEDLES,
  };

  it("production without token fails closed (skip)", async () => {
    const d = await decideIgnoredBuild({
      ...base,
      token: "",
      isProduction: true,
      fetchChecks: async () => [],
    });
    expect(d.proceed).toBe(false);
    expect(d.reason).toMatch(/fail closed/i);
  });

  it("preview without token proceeds", async () => {
    const d = await decideIgnoredBuild({
      ...base,
      token: "",
      isProduction: false,
      fetchChecks: async () => [],
    });
    expect(d.proceed).toBe(true);
  });

  it("skips while checks missing", async () => {
    const d = await decideIgnoredBuild({
      ...base,
      isProduction: true,
      fetchChecks: async () => [
        { name: "ci / web", status: "completed", conclusion: "success" },
      ],
    });
    expect(d.proceed).toBe(false);
    expect(d.reason).toMatch(/not yet reported/i);
  });

  it("skips when a required check failed", async () => {
    const d = await decideIgnoredBuild({
      ...base,
      isProduction: true,
      fetchChecks: async () =>
        DEFAULT_REQUIRED_CHECK_NEEDLES.map((n) => ({
          name: n === "e2e" ? "qa / e2e" : `x ${n}`,
          status: "completed",
          conclusion: n === "e2e" ? "failure" : "success",
        })),
    });
    expect(d.proceed).toBe(false);
    expect(d.reason).toMatch(/failed/i);
  });

  it("proceeds when all required needles succeed", async () => {
    const d = await decideIgnoredBuild({
      ...base,
      isProduction: true,
      fetchChecks: async () => [
        { name: "ci / web", status: "completed", conclusion: "success" },
        {
          name: "ci / python-pipelines",
          status: "completed",
          conclusion: "success",
        },
        {
          name: "qa / vitest-shard (1)",
          status: "completed",
          conclusion: "success",
        },
        {
          name: "qa / vitest-shard (2)",
          status: "completed",
          conclusion: "success",
        },
        { name: "qa / integration", status: "completed", conclusion: "success" },
        { name: "qa / e2e", status: "completed", conclusion: "success" },
      ],
    });
    expect(d.proceed).toBe(true);
  });

  it("skips while matching check is in progress", async () => {
    const d = await decideIgnoredBuild({
      ...base,
      isProduction: true,
      fetchChecks: async () => [
        { name: "ci / web", status: "completed", conclusion: "success" },
        {
          name: "ci / python-pipelines",
          status: "completed",
          conclusion: "success",
        },
        {
          name: "qa / vitest-shard (1)",
          status: "completed",
          conclusion: "success",
        },
        {
          name: "qa / vitest-shard (2)",
          status: "completed",
          conclusion: "success",
        },
        { name: "qa / integration", status: "completed", conclusion: "success" },
        { name: "qa / e2e", status: "in_progress", conclusion: null },
      ],
    });
    expect(d.proceed).toBe(false);
    expect(d.reason).toMatch(/in-progress/i);
  });
});
