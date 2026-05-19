"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

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
  bearerToken: string | null,
  variant: Props["variant"],
): Promise<{ goals: GoalRowEmployee[] | GoalRowManager[]; ok: boolean; retryable: boolean }> {
  const path =
    variant === "employee"
      ? "/api/v1/me/performance/goals"
      : "/api/v1/manager/performance/goals";

  const res = await hrApiFetch(path, {
    bearerToken,
    headers: { Accept: "application/json" },
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
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [goals, setGoals] = useState<(GoalRowEmployee | GoalRowManager)[] | undefined>(undefined);
  const [loadOk, setLoadOk] = useState<boolean | undefined>(undefined);
  const [retryable, setRetryable] = useState(false);

  const returnTo =
    variant === "employee" ? "/employee/performance/goals" : "/manager/team-performance";

  useEffect(() => {
    if (!isAuthenticated) {
      startTransition(() => {
        setGoals(undefined);
        setLoadOk(undefined);
        setRetryable(false);
      });
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await fetchGoals(bearerToken, variant);
      if (cancelled) return;
      setGoals(result.goals);
      setLoadOk(result.ok);
      setRetryable(result.retryable);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken, variant]);

  const reload = useCallback(() => {
    if (!isAuthenticated) return;
    void (async () => {
      const result = await fetchGoals(bearerToken, variant);
      setGoals(result.goals);
      setLoadOk(result.ok);
      setRetryable(result.retryable);
    })();
  }, [isAuthenticated, bearerToken, variant]);

  const heading =
    variant === "employee"
      ? "Your goals load from Core HR when you are signed in."
      : "Direct reports’ goals appear here when hierarchy and seeds are wired.";

  if (!ready) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Checking your session…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title={variant === "employee" ? "Performance goals" : "Team performance goals"}
        description={
          variant === "employee"
            ? "Sign in to view your performance goals."
            : "Sign in as a manager to view your team’s goals."
        }
        returnTo={returnTo}
        onDevTokenPaste={persistBearer}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{variant === "employee" ? "Your goals" : "Team goals"}</CardTitle>
        <CardDescription>{heading}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => reload()}>
            Reload goals
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>

        {loadOk === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !loadOk ? (
          <p className="text-sm text-destructive">
            Could not load goals.
            {retryable ? " Try again in a moment." : " Check your session and role."}
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
                  <p className="font-medium text-foreground">{(g as GoalRowManager).employeeDisplayName}</p>
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
