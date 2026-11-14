import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/auth/neon/complete/route";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  listAccounts: vi.fn(),
  getAccessToken: vi.fn(),
  provisionByEmail: vi.fn(),
  provisionByToken: vi.fn(),
}));

vi.mock("@/lib/auth/neon-auth-config", () => ({
  neonAuthConfigured: () => true,
}));
vi.mock("@/lib/auth/neon-auth-server", () => ({ getNeonAuth: () => auth }));
vi.mock("@/lib/auth/provision-session-from-oidc", () => ({
  provisionHrSessionFromEmail: auth.provisionByEmail,
  accessTokenForOidcLogin: auth.provisionByToken,
}));
vi.mock("@/lib/auth/session-cookie", () => ({
  buildSessionSetCookieHeader: (token: string) =>
    `hrerp_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
}));
vi.mock("@/lib/auth/public-origin", () => ({
  resolvePublicOrigin: () => "https://app.example.test",
}));

function complete() {
  return GET(
    new Request(
      "https://app.example.test/api/auth/neon/complete?returnTo=/employee",
    ),
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  auth.getSession.mockResolvedValue({
    data: {
      user: { id: "synthetic-user", email: null },
      session: { token: "synthetic-neon-session-not-a-provider-token" },
    },
    error: null,
  });
  auth.listAccounts.mockResolvedValue({
    data: [
      { id: "github-row", providerId: "github", accountId: "github-subject" },
      { id: "google-row", providerId: "google", accountId: "google-subject" },
    ],
    error: null,
  });
  auth.getAccessToken.mockResolvedValue({
    data: { accessToken: "synthetic-google-token" },
    error: null,
  });
  auth.provisionByToken.mockResolvedValue("synthetic-hr-token");
  auth.provisionByEmail.mockResolvedValue("synthetic-hr-token");
});

describe("Neon sign-in completion", () => {
  it("keeps the email provisioning path independent of provider token lookup", async () => {
    auth.getSession.mockResolvedValue({
      data: { user: { id: "synthetic-user", email: "alex@example.test" } },
      error: null,
    });
    const response = await complete();
    expect(response.status).toBe(307);
    expect(auth.provisionByEmail).toHaveBeenCalledExactlyOnceWith(
      "alex@example.test",
    );
    expect(auth.listAccounts).not.toHaveBeenCalled();
    expect(auth.getAccessToken).not.toHaveBeenCalled();
    expect(auth.provisionByToken).not.toHaveBeenCalled();
  });

  it("selects Google's internal account row before provisioning from its provider token", async () => {
    const response = await complete();
    expect(auth.getAccessToken).toHaveBeenCalledExactlyOnceWith({
      accountId: "google-row",
    });
    expect(auth.provisionByToken).toHaveBeenCalledExactlyOnceWith(
      "synthetic-google-token",
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://app.example.test/employee",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "hrerp_session=synthetic-hr-token",
    );
  });

  it("accepts the provider ID token when no access token is returned", async () => {
    auth.getAccessToken.mockResolvedValue({
      data: { idToken: "synthetic-google-id-token" },
      error: null,
    });
    expect((await complete()).status).toBe(307);
    expect(auth.provisionByToken).toHaveBeenCalledExactlyOnceWith(
      "synthetic-google-id-token",
    );
  });

  it("rejects an absent session before looking up accounts", async () => {
    auth.getSession.mockResolvedValue({ data: null, error: { status: 401 } });
    expect((await complete()).status).toBe(401);
    expect(auth.listAccounts).not.toHaveBeenCalled();
    expect(auth.provisionByToken).not.toHaveBeenCalled();
  });

  it.each([
    { data: [], error: null },
    { data: [{ id: "github-row", providerId: "github" }], error: null },
    { data: [{ id: "", providerId: "google" }], error: null },
    { data: null, error: { status: 503 } },
  ])(
    "does not mint an HR session when the Google account cannot be selected: %j",
    async (result) => {
      auth.listAccounts.mockResolvedValue(result);
      const response = await complete();
      expect(response.status).toBe(403);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(auth.getAccessToken).not.toHaveBeenCalled();
      expect(auth.provisionByToken).not.toHaveBeenCalled();
    },
  );

  it.each([
    { data: null, error: { status: 401 } },
    { data: { accessToken: "untrusted-token" }, error: { status: 403 } },
    { data: {}, error: null },
  ])(
    "never substitutes the Neon session token when the provider token is unavailable: %j",
    async (result) => {
      auth.getAccessToken.mockResolvedValue(result);
      const response = await complete();
      expect(response.status).toBe(403);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(auth.provisionByToken).not.toHaveBeenCalled();
    },
  );
});
