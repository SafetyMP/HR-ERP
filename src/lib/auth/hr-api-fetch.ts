export type HrApiFetchOptions = RequestInit & {
  /** When set, sends Authorization Bearer. Omit when using httpOnly session cookie. */
  bearerToken?: string | null;
  /** When true (default if no bearerToken), sends cookies for session auth. */
  useSessionCookie?: boolean;
};

export async function hrApiFetch(
  input: string,
  options: HrApiFetchOptions = {},
): Promise<Response> {
  const { bearerToken, useSessionCookie, ...init } = options;
  const headers = new Headers(init.headers);
  if (bearerToken?.trim()) {
    headers.set("Authorization", `Bearer ${bearerToken.trim()}`);
  }
  const credentials =
    useSessionCookie === false && bearerToken
      ? "same-origin"
      : "include";
  return fetch(input, { ...init, headers, credentials });
}
