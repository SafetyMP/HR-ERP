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
import { Input } from "@/components/ui/input";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

import type { GoalRowEmployee, GoalRowManager } from "./goals-demo-client";

type Cycle = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
};

type Props = {
  variant: "employee" | "manager";
  initialBearerToken?: string;
};

async function fetchOpenCycle(bearerToken: string | null): Promise<Cycle | null> {
  const res = await hrApiFetch("/api/v1/performance/cycles?status=OPEN", {
    bearerToken,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: { cycles?: Cycle[] } };
  return body.data?.cycles?.[0] ?? null;
}

async function fetchGoals(
  bearerToken: string | null,
  variant: Props["variant"],
  cycleId?: string,
) {
  const path =
    variant === "employee"
      ? `/api/v1/me/performance/goals${cycleId ? `?cycleId=${cycleId}` : ""}`
      : `/api/v1/manager/performance/goals${cycleId ? `?cycleId=${cycleId}` : ""}`;

  const res = await hrApiFetch(path, {
    bearerToken,
    headers: { Accept: "application/json" },
  });
  if (res.status === 401) return { goals: [], ok: false, forbidden: false, retryable: false };
  if (res.status === 403) return { goals: [], ok: false, forbidden: true, retryable: false };
  if (!res.ok)
    return { goals: [], ok: false, forbidden: false, retryable: res.status >= 500 };
  const body = (await res.json()) as {
    data?: { goals?: GoalRowEmployee[] | GoalRowManager[] };
  };
  return { goals: body.data?.goals ?? [], ok: true, forbidden: false, retryable: false };
}

export function PerformanceGoalsClient({ variant, initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [cycle, setCycle] = useState<Cycle | null | undefined>(undefined);
  const [goals, setGoals] = useState<(GoalRowEmployee | GoalRowManager)[] | undefined>(
    undefined,
  );
  const [loadOk, setLoadOk] = useState<boolean | undefined>(undefined);
  const [retryable, setRetryable] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [title, setTitle] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const returnTo =
    variant === "employee" ? "/employee/performance/goals" : "/manager/team-performance";

  const reload = useCallback(async () => {
    const openCycle = await fetchOpenCycle(bearerToken);
    setCycle(openCycle);
    const result = await fetchGoals(bearerToken, variant, openCycle?.id);
    setGoals(result.goals);
    setLoadOk(result.ok);
    setForbidden(result.forbidden);
    setRetryable(result.retryable);
  }, [bearerToken, variant]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => {
      setCycle(undefined);
      setGoals(undefined);
    });
    void (async () => {
      await reload();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, reload]);

  const createGoal = async () => {
    if (!title.trim() || !cycle?.id) return;
    setBusy(true);
    setMsg(null);
    try {
      const path =
        variant === "employee"
          ? "/api/v1/me/performance/goals"
          : "/api/v1/manager/performance/goals";
      const body =
        variant === "employee"
          ? { cycleId: cycle.id, title: title.trim() }
          : {
              cycleId: cycle.id,
              title: title.trim(),
              employeeId: employeeId.trim(),
            };
      if (variant === "manager" && !employeeId.trim()) {
        setMsg("Enter a direct report employee ID.");
        return;
      }
      const res = await hrApiFetch(path, {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        setMsg("This performance cycle is not open for new goals.");
        return;
      }
      if (!res.ok) {
        setMsg("Could not save goal.");
        return;
      }
      setTitle("");
      await reload();
      setMsg("Goal saved.");
    } finally {
      setBusy(false);
    }
  };

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
        description="Sign in to view and manage goals."
        returnTo={returnTo}
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (forbidden) {
    return (
      <p className="text-sm text-muted-foreground">
        Your session cannot access performance goals for this view.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{variant === "employee" ? "Your goals" : "Team goals"}</CardTitle>
        <CardDescription>
          {cycle === undefined
            ? "Loading cycle…"
            : cycle
              ? `${cycle.name} (${cycle.startDate} → ${cycle.endDate})`
              : "No open performance cycle — ask HR to open one or run demo bootstrap."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void reload()}>
            Reload
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>

        {cycle ? (
          <div className="flex flex-col gap-2 rounded-md border border-border p-4">
            <p className="text-sm font-medium text-foreground">Add a goal</p>
            {variant === "manager" ? (
              <Input
                placeholder="Direct report employee ID (UUID)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="font-mono text-xs"
              />
            ) : null}
            <Input
              placeholder="Goal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Button type="button" onClick={() => void createGoal()} disabled={busy}>
              {busy ? "Saving…" : "Save goal"}
            </Button>
          </div>
        ) : null}

        {loadOk === false ? (
          <p className="text-sm text-destructive">
            Could not load goals.
            {retryable ? (
              <>
                {" "}
                <Button type="button" variant="link" className="h-auto p-0" onClick={() => void reload()}>
                  Retry
                </Button>
              </>
            ) : null}
          </p>
        ) : goals?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No goals yet for this cycle.</p>
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
                  {g.status}
                  {g.dueDate ? ` · due ${g.dueDate}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </CardContent>
    </Card>
  );
}
