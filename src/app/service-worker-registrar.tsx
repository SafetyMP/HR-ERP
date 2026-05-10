"use client";

import { useEffect } from "react";

/**
 * Registers `/service-worker.js`. Only runs in production builds and only when the
 * browser supports service workers. The service worker itself never caches API or
 * authenticated traffic — it is purely an offline-shell + static asset accelerator.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .catch(() => {
          // Registration failures are intentionally swallowed — the app remains
          // usable without offline support.
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
