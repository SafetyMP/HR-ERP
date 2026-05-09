import { describe, expect, it } from "vitest";

import { patchMyProfileSchema } from "@/lib/profile/patch-my-profile-schema";

describe("patchMyProfileSchema", () => {
  it("accepts a representative employee-safe patch", () => {
    const parsed = patchMyProfileSchema.safeParse({
      preferredName: "Alex",
      personalEmail: "alex@example.com",
      phone: "+1 4155550199",
      mailingCity: "Berlin",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.preferredName).toBe("Alex");
      expect(parsed.data.personalEmail).toBe("alex@example.com");
    }
  });

  it("coerces blank strings on editable scalars to null", () => {
    const parsed = patchMyProfileSchema.safeParse({
      preferredName: "   ",
      phone: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.preferredName).toBeNull();
      expect(parsed.data.phone).toBeNull();
    }
  });

  it("rejects malformed email without succeeding parse", () => {
    const parsed = patchMyProfileSchema.safeParse({
      personalEmail: "not-an-email",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown JSON keys", () => {
    const parsed = patchMyProfileSchema.safeParse({
      preferredName: "OK",
      workEmail: "evil@example.com",
    });
    expect(parsed.success).toBe(false);
  });
});
