import { describe, expect, it } from "vitest";

import {
  NEON_AUTH_CALLBACK_PATH,
  neonAuthCallbackUrl,
  resolvePublicOrigin,
} from "@/lib/auth/public-origin";

describe("resolvePublicOrigin", () => {
  it("prefers AUTH_PUBLIC_ORIGIN when set", () => {
    const prev = process.env.AUTH_PUBLIC_ORIGIN;
    process.env.AUTH_PUBLIC_ORIGIN = "https://app.example.com/";
    try {
      const req = new Request("http://internal/api/auth/neon/login");
      expect(resolvePublicOrigin(req)).toBe("https://app.example.com");
    } finally {
      if (prev === undefined) delete process.env.AUTH_PUBLIC_ORIGIN;
      else process.env.AUTH_PUBLIC_ORIGIN = prev;
    }
  });

  it("uses x-forwarded-host and x-forwarded-proto on Vercel-style requests", () => {
    const prevPublic = process.env.AUTH_PUBLIC_ORIGIN;
    delete process.env.AUTH_PUBLIC_ORIGIN;
    try {
      const req = new Request("http://127.0.0.1:3000/api/auth/neon/login", {
        headers: {
          "x-forwarded-host": "hr-erp-harts.vercel.app",
          "x-forwarded-proto": "https",
        },
      });
      expect(resolvePublicOrigin(req)).toBe("https://hr-erp-harts.vercel.app");
    } finally {
      if (prevPublic === undefined) delete process.env.AUTH_PUBLIC_ORIGIN;
      else process.env.AUTH_PUBLIC_ORIGIN = prevPublic;
    }
  });

  it("falls back to request.url origin", () => {
    const prevPublic = process.env.AUTH_PUBLIC_ORIGIN;
    delete process.env.AUTH_PUBLIC_ORIGIN;
    try {
      const req = new Request("http://localhost:3000/api/auth/neon/login");
      expect(resolvePublicOrigin(req)).toBe("http://localhost:3000");
    } finally {
      if (prevPublic === undefined) delete process.env.AUTH_PUBLIC_ORIGIN;
      else process.env.AUTH_PUBLIC_ORIGIN = prevPublic;
    }
  });
});

describe("neonAuthCallbackUrl", () => {
  it("builds callback without query string", () => {
    expect(neonAuthCallbackUrl("https://app.example.com")).toBe(
      `https://app.example.com${NEON_AUTH_CALLBACK_PATH}`,
    );
  });
});
