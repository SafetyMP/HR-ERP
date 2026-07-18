import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertDrainUrlDistinctFromApp,
  resolveDrainDatabaseUrl,
} from "@/lib/security/drain-db";

describe("drain-db", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers WORKER_DRAIN_DATABASE_URL over OUTBOX_DATABASE_URL", () => {
    vi.stubEnv("WORKER_DRAIN_DATABASE_URL", "postgres://drain/db");
    vi.stubEnv("OUTBOX_DATABASE_URL", "postgres://outbox/db");
    expect(resolveDrainDatabaseUrl()).toBe("postgres://drain/db");
  });

  it("falls back to OUTBOX_DATABASE_URL", () => {
    vi.stubEnv("WORKER_DRAIN_DATABASE_URL", "");
    vi.stubEnv("OUTBOX_DATABASE_URL", "postgres://outbox/db");
    expect(resolveDrainDatabaseUrl()).toBe("postgres://outbox/db");
  });

  it("falls back to DATABASE_URL outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("WORKER_DRAIN_DATABASE_URL", "");
    vi.stubEnv("OUTBOX_DATABASE_URL", "");
    vi.stubEnv("DATABASE_URL", "postgres://app/db");
    expect(resolveDrainDatabaseUrl()).toBe("postgres://app/db");
  });

  it("throws in production when drain URL equals app URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DRAIN_SAME_AS_APP", "");
    vi.stubEnv("DATABASE_URL", "postgres://same/db");
    vi.stubEnv("WORKER_DRAIN_DATABASE_URL", "postgres://same/db");
    expect(() => assertDrainUrlDistinctFromApp()).toThrow(/must differ/);
  });

  it("allows same URL when ALLOW_DRAIN_SAME_AS_APP=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DRAIN_SAME_AS_APP", "1");
    vi.stubEnv("DATABASE_URL", "postgres://same/db");
    vi.stubEnv("WORKER_DRAIN_DATABASE_URL", "postgres://same/db");
    expect(() => assertDrainUrlDistinctFromApp()).not.toThrow();
  });
});
