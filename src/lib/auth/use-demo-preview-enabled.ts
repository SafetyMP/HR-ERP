"use client";

import { useEffect, useState } from "react";

import { demoPreviewSignInUiEnabled } from "@/lib/auth/demo-preview-config";

/**
 * Demo preview UI is shown when NEXT_PUBLIC_DEMO_PREVIEW_SIGNIN is set at build time,
 * or when the deployment reports enabled via /api/auth/demo-preview/status (Preview / local).
 */
export function useDemoPreviewEnabled(): boolean {
  const buildTime = demoPreviewSignInUiEnabled();
  const [runtime, setRuntime] = useState<boolean | null>(buildTime ? true : null);

  useEffect(() => {
    if (buildTime) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/demo-preview/status", {
          credentials: "same-origin",
        });
        const body = (await res.json()) as { enabled?: boolean };
        if (!cancelled) setRuntime(body.enabled === true);
      } catch {
        if (!cancelled) setRuntime(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buildTime]);

  if (buildTime) return true;
  return runtime === true;
}
