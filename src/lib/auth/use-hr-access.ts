"use client";

import {
  clearDevBearerTokenFromSession,
  HRERP_AUTH_SYNC_EVENT,
  readDevBearerTokenFromSession,
  writeDevBearerTokenToSession,
} from "@/lib/auth/dev-bearer-session";

import { startTransition, useCallback, useEffect, useState } from "react";

export { switchAccountRedirectTarget } from "@/lib/auth/switch-account";

export type HrAccessMode = "none" | "cookie" | "bearer";

export type SignOutOptions = {
  /** When set, navigate after clearing session (full reload). */
  redirectTo?: string;
};

export function useHrAccess(initialBearerToken?: string) {
  const [mode, setMode] = useState<HrAccessMode>("none");
  const [bearerToken, setBearerToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const body = (await res.json()) as { authenticated?: boolean };
        if (cancelled) return;
        if (body.authenticated) {
          startTransition(() => {
            setMode("cookie");
            setBearerToken(null);
            setReady(true);
          });
          return;
        }
      } catch {
        /* session probe failed — fall through to dev bearer */
      }

      if (cancelled) return;
      const fromStorage = readDevBearerTokenFromSession();
      if (fromStorage) {
        startTransition(() => {
          setMode("bearer");
          setBearerToken(fromStorage);
          setReady(true);
        });
        return;
      }
      if (initialBearerToken?.trim()) {
        const t = writeDevBearerTokenToSession(initialBearerToken);
        if (t) {
          startTransition(() => {
            setMode("bearer");
            setBearerToken(t);
            setReady(true);
          });
          return;
        }
      }
      startTransition(() => {
        setMode("none");
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [initialBearerToken]);

  useEffect(() => {
    const onAuthSync = (event: Event) => {
      const token = (event as CustomEvent<{ token: string | null }>).detail?.token ?? null;
      setBearerToken(token);
      setMode(token ? "bearer" : "none");
    };
    window.addEventListener(HRERP_AUTH_SYNC_EVENT, onAuthSync);
    return () => window.removeEventListener(HRERP_AUTH_SYNC_EVENT, onAuthSync);
  }, []);

  const persistBearer = useCallback((raw: string) => {
    const t = writeDevBearerTokenToSession(raw);
    setBearerToken(t || null);
    setMode(t ? "bearer" : "none");
    return t;
  }, []);

  const signOut = useCallback(async (options?: SignOutOptions) => {
    clearDevBearerTokenFromSession();
    setBearerToken(null);
    setMode("none");
    try {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    } catch {
      /* ignore */
    }
    if (options?.redirectTo !== undefined) {
      window.location.assign(options.redirectTo);
    }
  }, []);

  const isAuthenticated = mode === "cookie" || Boolean(bearerToken);

  return {
    mode,
    bearerToken,
    ready,
    isAuthenticated,
    persistBearer,
    signOut,
  };
}
