"use client";

import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STORAGE_KEY = "hrerp_bearer_token";

type Props = {
  initialBearerToken?: string;
};

type OrgCtx = {
  self: { employeeId: string; displayName: string };
  managerChain: { employeeId: string; displayName: string }[];
  peers: { employeeId: string; displayName: string }[];
  department: { name: string; code: string | null } | null;
};

export function OrganizationContextClient({ initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [ctx, setCtx] = useState<OrgCtx | null | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startTransition(() => {
      const fromStorage = sessionStorage.getItem(STORAGE_KEY)?.trim();
      if (fromStorage) setTokenState(fromStorage);
      else if (initialBearerToken?.trim()) {
        sessionStorage.setItem(STORAGE_KEY, initialBearerToken.trim());
        setTokenState(initialBearerToken.trim());
      }
    });
  }, [initialBearerToken]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    startTransition(() => setCtx(undefined));
    void (async () => {
      const res = await fetch("/api/v1/me/organization/context", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (cancelled) return;
      if (!res.ok) {
        setCtx(null);
        return;
      }
      const body = (await res.json()) as { data?: { organizationContext?: OrgCtx } };
      setCtx(body.data?.organizationContext ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) return null;

  if (ctx === undefined) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading directory snapshot…</p>;
  }

  if (ctx === null) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Couldn&apos;t load organization context — refresh your session token.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>You</CardTitle>
          <CardDescription>Minimum viable directory slice — no salary or performance data.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="font-medium text-zinc-950 dark:text-zinc-50">{ctx.self.displayName}</div>
          {ctx.department ? (
            <div className="mt-2 text-zinc-600 dark:text-zinc-400">
              Department: {ctx.department.name}
              {ctx.department.code ? ` (${ctx.department.code})` : ""}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Management chain</CardTitle>
          <CardDescription>Nearest managers up to org root as modeled in Core HR.</CardDescription>
        </CardHeader>
        <CardContent>
          {ctx.managerChain.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No manager recorded.</p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-800 dark:text-zinc-200">
              {ctx.managerChain.map((m) => (
                <li key={m.employeeId}>{m.displayName}</li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Peers</CardTitle>
          <CardDescription>Teammates who share your manager (when Core HR lists one).</CardDescription>
        </CardHeader>
        <CardContent>
          {ctx.peers.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No peers found or you&apos;re the only report.</p>
          ) : (
            <ul className="space-y-2 text-sm text-zinc-800 dark:text-zinc-200" role="list">
              {ctx.peers.map((p) => (
                <li key={p.employeeId}>{p.displayName}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" type="button" onClick={() => window.location.assign("/")}>
        Home
      </Button>
    </div>
  );
}
