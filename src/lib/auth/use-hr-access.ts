"use client";

import {
  clearDevBearerTokenFromSession,
  readDevBearerTokenFromSession,
  writeDevBearerTokenToSession,
} from "@/lib/auth/dev-bearer-session";

import { startTransition, useCallback, useEffect, useState } from "react";

export type HrAccessMode = "none" | "cookie" | "bearer";

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

  const persistBearer = useCallback((raw: string) => {
    const t = writeDevBearerTokenToSession(raw);
    setBearerToken(t || null);
    setMode(t ? "bearer" : "none");
    return t;
  }, []);

  const signOut = useCallback(() => {
    clearDevBearerTokenFromSession();
    void fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    setBearerToken(null);
    setMode("none");
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
