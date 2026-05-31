import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/v1/errors";
import { assertTrackDApiAllowed } from "@/lib/api/v1/track-d-guard";

describe("assertTrackDApiAllowed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows non-production without flag", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("TRACK_D_API_ENABLED", "");
    expect(() => assertTrackDApiAllowed()).not.toThrow();
  });

  it("denies production without flag", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRACK_D_API_ENABLED", "");
    try {
      assertTrackDApiAllowed();
      expect.fail("expected ApiError");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(404);
    }
  });

  it("allows production when TRACK_D_API_ENABLED=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRACK_D_API_ENABLED", "1");
    expect(() => assertTrackDApiAllowed()).not.toThrow();
  });
});
