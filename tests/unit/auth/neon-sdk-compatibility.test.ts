import { createNeonAuth } from "@neondatabase/auth/next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getNeonAuth } from "@/lib/auth/neon-auth-server";

const context = vi.hoisted(() => ({
  headers: vi.fn(),
  cookies: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: context.headers,
  cookies: context.cookies,
}));

const baseUrl = "https://auth.example.test/neondb/auth";
const cookieSecret = "synthetic-compatibility-test-secret-32-characters";
const sessionCookie = "__Secure-neon-auth.session_token=synthetic-session";
const fetchMock = vi.fn<typeof fetch>();

function sdk() {
  return createNeonAuth({
    baseUrl,
    cookies: { secret: cookieSecret, sameSite: "strict" },
    logLevel: "silent",
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEON_AUTH_BASE_URL", "");
  vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "");
  // No test can fall through to a real provider or use a real session.
  fetchMock.mockRejectedValue(
    new Error("Unexpected network call in compatibility test"),
  );
  vi.stubGlobal("fetch", fetchMock);
  context.headers.mockResolvedValue(
    new Headers({
      cookie: `${sessionCookie}; hrerp_session=synthetic-private-app-cookie`,
      origin: "https://app.example.test",
    }),
  );
  context.cookies.mockResolvedValue({ set: context.setCookie });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Neon SDK with patched transitive authentication dependencies", () => {
  it("rejects missing application configuration and weak SDK cookie secrets before any request", () => {
    expect(() => getNeonAuth()).toThrow("neon_auth_not_configured");
    expect(() =>
      createNeonAuth({ baseUrl, cookies: { secret: "too-short" } }),
    ).toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates the configured application adapter without requiring an upstream connection", () => {
    vi.stubEnv("NEON_AUTH_BASE_URL", baseUrl);
    vi.stubEnv("NEON_AUTH_COOKIE_SECRET", cookieSecret);
    const auth = getNeonAuth();
    expect(typeof auth.getSession).toBe("function");
    expect(typeof auth.getAccessToken).toBe("function");
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"] as const) {
      expect(typeof auth.handler()[method]).toBe("function");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("proxies a social sign-in while keeping application cookies out of the auth request", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { url: "https://identity.example.test/authorize", redirect: true },
        {
          headers: {
            "Set-Cookie":
              "__Secure-neon-auth.session_challange=synthetic-challenge; Path=/; HttpOnly; Secure; SameSite=Lax",
          },
        },
      ),
    );
    const body = {
      provider: "google",
      callbackURL: "https://app.example.test/api/auth/neon/complete",
    };
    const response = await sdk()
      .handler()
      .POST(
        new Request("https://app.example.test/api/neon-auth/sign-in/social", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `${sessionCookie}; hrerp_session=synthetic-private-app-cookie`,
          },
          body: JSON.stringify(body),
        }),
        { params: Promise.resolve({ path: ["sign-in", "social"] }) },
      );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${baseUrl}/sign-in/social`);
    expect(options?.method).toBe("POST");
    expect(options?.body).toBe(JSON.stringify(body));
    expect(new Headers(options?.headers).get("cookie")).toBe(sessionCookie);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://identity.example.test/authorize",
      redirect: true,
    });
    const forwardedCookie = response.headers.get("set-cookie");
    expect(forwardedCookie).toContain(
      "__Secure-neon-auth.session_challange=synthetic-challenge",
    );
    expect(forwardedCookie).toContain("HttpOnly");
    expect(forwardedCookie).toContain("Secure");
  });

  it("returns a server session through the Next request context without leaking application cookies", async () => {
    const session = {
      user: { id: "synthetic-user", email: "alex@example.test" },
      session: { id: "synthetic-session" },
    };
    fetchMock.mockResolvedValueOnce(Response.json(session));
    const result = await sdk().getSession();
    expect(result.data).toEqual(session);
    expect(result.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${baseUrl}/get-session`);
    expect(new Headers(options?.headers).get("cookie")).toBe(sessionCookie);
    expect(new Headers(options?.headers).get("origin")).toBe(
      "https://app.example.test",
    );
  });

  it("preserves an upstream token denial as an error instead of an authenticated result", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { message: "Synthetic expired session", code: "UNAUTHORIZED" },
        { status: 401 },
      ),
    );
    const result = await sdk().getAccessToken({
      accountId: "synthetic-account-row",
    });
    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({
      status: 401,
      code: "session_not_found",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${baseUrl}/get-access-token`);
    expect(options?.method).toBe("POST");
    expect(JSON.parse(String(options?.body))).toEqual({
      accountId: "synthetic-account-row",
    });
  });

  it("lists linked accounts and sends the selected internal account ID in the token request body", async () => {
    const account = {
      id: "synthetic-account-row",
      accountId: "synthetic-google-subject",
      providerId: "google",
      userId: "synthetic-user",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      scopes: ["openid", "email"],
    };
    fetchMock
      .mockResolvedValueOnce(Response.json([account]))
      .mockResolvedValueOnce(
        Response.json({ accessToken: "synthetic-provider-token" }),
      );

    const auth = sdk();
    const accounts = await auth.listAccounts();
    expect(accounts.error).toBeNull();
    expect(accounts.data).toEqual([account]);
    const token = await auth.getAccessToken({ accountId: account.id });
    expect(token.error).toBeNull();
    expect(token.data?.accessToken).toBe("synthetic-provider-token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(`${baseUrl}/list-accounts`);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe(`${baseUrl}/get-access-token`);
    expect(options?.method).toBe("POST");
    expect(JSON.parse(String(options?.body))).toEqual({
      accountId: account.id,
    });
    expect(new Headers(options?.headers).get("cookie")).toBe(sessionCookie);
  });
});
