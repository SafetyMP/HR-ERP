import { redirect } from "next/navigation";

/**
 * When `?devJwt=` is present in development, establish httpOnly session and redirect
 * to the same path without the query param.
 */
export function redirectDevJwtToSession(
  devJwt: string | undefined,
  returnPath: string,
): void {
  if (process.env.NODE_ENV !== "development" || !devJwt?.trim()) {
    return;
  }
  const qs = new URLSearchParams({
    token: devJwt.trim(),
    returnTo: returnPath,
  });
  redirect(`/api/auth/dev-bootstrap?${qs.toString()}`);
}
