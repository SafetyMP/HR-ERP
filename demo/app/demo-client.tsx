"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { readView } from "./demo-model";
import { ReleaseCase } from "./release-case";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
const readHash = () => window.location.hash;
const emptyHash = () => "";

export function DemoClient() {
  const hash = useSyncExternalStore(subscribe, readHash, emptyHash);
  const view = readView(hash);
  const mainRef = useRef<HTMLElement>(null);
  const previous = useRef(view.technical);
  useEffect(() => {
    if (previous.current !== view.technical) {
      mainRef.current?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      previous.current = view.technical;
    }
  }, [view.technical]);
  return <ReleaseCase mainRef={mainRef} view={view} />;
}
