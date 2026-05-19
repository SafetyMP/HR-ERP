"use client";

import { startTransition, useEffect, useState } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

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
  const { bearerToken, ready, isAuthenticated, persistBearer } = useHrAccess(initialBearerToken);
  const [ctx, setCtx] = useState<OrgCtx | null | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => setCtx(undefined));
    void (async () => {
      const res = await hrApiFetch("/api/v1/me/organization/context", {
        bearerToken,
        headers: { Accept: "application/json" },
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
  }, [isAuthenticated, bearerToken]);

  if (!ready) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Checking your session…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="Organization"
        description="Sign in to view your team and management chain."
        returnTo="/employee/organization"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (ctx === undefined) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading directory snapshot…</p>;
  }

  if (ctx === null) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Couldn&apos;t load organization context — try signing in again.
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
