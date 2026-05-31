"use client";

import { useEffect, useState } from "react";

import type { DemoPreviewPersona } from "@/lib/auth/demo-preview-config";

type DemoSessionState = {
  ready: boolean;
  demoPersona: DemoPreviewPersona | null;
};

export function useDemoSession(): DemoSessionState {
  const [state, setState] = useState<DemoSessionState>({
    ready: false,
    demoPersona: null,
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const body = (await res.json()) as {
          authenticated?: boolean;
          demoPersona?: DemoPreviewPersona | null;
        };
        if (cancelled) return;
        setState({
          ready: true,
          demoPersona: body.authenticated ? (body.demoPersona ?? null) : null,
        });
      } catch {
        if (!cancelled) {
          setState({ ready: true, demoPersona: null });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
