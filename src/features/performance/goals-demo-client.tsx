"use client";

import {
  clearDevBearerTokenFromSession,
  readDevBearerTokenFromSession,
  writeDevBearerTokenToSession,
} from "@/lib/auth/dev-bearer-session";

import { startTransition, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type GoalRowEmployee = {
  id: string;
  cycleId: string;
  title: string;
  status: string;
  weightBp: number;
  percentCompleteBp: number;
  dueDate: string | null;
};

export type GoalRowManager = GoalRowEmployee & {
  employeeId: string;
  employeeDisplayName: string;
};

type Props = {
  variant: "employee" | "manager";
  /** Used by Playwright / QA to inject a bearer token before hydration. */
  initialBearerToken?: string;
};

async function fetchGoals(
  token: string,
  variant: Props["variant"],
): Promise<{ goals: GoalRowEmployee[] | GoalRowManager[]; ok: boolean; retryable: boolean }> {
  const path =
    variant === "employee"
      ? "/api/v1/me/performance/goals"
      : "/api/v1/manager/performance/goals";

  const res = await fetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (res.status === 401) {
    return { goals: [], ok: false, retryable: false };
  }

  const body = (await res.json()) as {
    data?: { goals?: GoalRowEmployee[] | GoalRowManager[] };
    error?: { code?: string; message?: string };
  };

  if (!res.ok) {
    const retryable = res.status >= 500;
    return { goals: [], ok: false, retryable };
  }

  return {
    goals: body.data?.goals ?? [],
    ok: true,
    retryable: false,
  };
}

export function GoalsDemoClient({ variant, initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [goals, setGoals] = useState<(GoalRowEmployee | GoalRowManager)[] | undefined>(undefined);
  const [loadOk, setLoadOk] = useState<boolean | undefined>(undefined);
  const [retryable, setRetryable] = useState(false);

  const persistToken = useCallback((next: string | null) => {
    if (next?.trim()) {
      writeDevBearerTokenToSession(next.trim());
    } else {
      clearDevBearerTokenFromSession();
    }
    startTransition(() => setTokenState(next?.trim() ?? null));
  }, []);

  useEffect(() => {
    const fromSession = readDevBearerTokenFromSession();
    if (initialBearerToken?.trim()) {
      persistToken(initialBearerToken.trim());
      return;
    }
    if (fromSession?.trim()) {
      persistToken(fromSession.trim());
    }
  }, [initialBearerToken, persistToken]);

  useEffect(() => {
    if (!token) {
      startTransition(() => {
        setGoals(undefined);
        setLoadOk(undefined);
        setRetryable(false);
      });
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await fetchGoals(token, variant);
      if (cancelled) return;
      setGoals(result.goals);
      setLoadOk(result.ok);
      setRetryable(result.retryable);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, variant]);

  const reload = useCallback(() => {
    if (!token) return;
    void (async () => {
      const result = await fetchGoals(token, variant);
      setGoals(result.goals);
      setLoadOk(result.ok);
      setRetryable(result.retryable);
    })();
  }, [token, variant]);

  const heading =
    variant === "employee"
      ? "Your goals load from Core HR when you are signed in."
      : "Direct reports’ goals appear here when hierarchy and seeds are wired.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dev bearer token</CardTitle>
        <CardDescription>
          Paste a JWT from <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">npm run jwt:dev</code>{" "}
          {variant === "manager"
            ? "(use roles=manager and manager employee id for hierarchy)."
            : "(employee principal recommended)."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <textarea
          className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Paste Bearer token…"
          aria-label="Bearer token"
          value={token ?? ""}
          onChange={(e) => persistToken(e.target.value || null)}
          spellCheck={false}
          autoComplete="off"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => reload()} disabled={!token}>
            Reload goals
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => persistToken(null)}>
            Clear token
          </Button>
        </div>

        {!token ? (
          <p className="text-sm text-muted-foreground">{heading}</p>
        ) : loadOk === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !loadOk ? (
          <p className="text-sm text-destructive">
            Could not load goals.
            {retryable ? " Try again in a moment." : " Check your token role and tenant."}
          </p>
        ) : goals?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No goals returned yet. Run <code className="rounded bg-muted px-1 font-mono text-xs">demo:bootstrap</code>{" "}
            and confirm an open performance cycle exists.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border" role="list">
            {goals!.map((g) => (
              <li key={g.id} className="list-none px-4 py-3 text-sm">
                {variant === "manager" && "employeeDisplayName" in g ? (
                  <p className="font-medium text-foreground">
                    {(g as GoalRowManager).employeeDisplayName}
                  </p>
                ) : null}
                <p className="text-foreground">{g.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {g.status} · weight {g.weightBp} bp · progress {g.percentCompleteBp} bp
                  {g.dueDate ? ` · due ${g.dueDate}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
