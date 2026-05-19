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


export type OnboardingTaskApi = {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  updatedAt: string;
};

type Props = {
  initialBearerToken?: string;
};

function labelStatus(s: string): string {
  if (s === "PENDING") return "Not started";
  if (s === "IN_PROGRESS") return "In progress";
  if (s === "DONE") return "Done";
  return s;
}

async function fetchOnboardingTasks(bearerToken: string | null): Promise<{
  tasks: OnboardingTaskApi[] | null;
  ok: boolean;
  auth: boolean;
}> {
  const res = await hrApiFetch("/api/v1/me/onboarding/tasks", {
    bearerToken, 
    headers: { Accept: "application/json" },
  })
  if (res.status === 401) {
    return { tasks: null, ok: false, auth: true };
  }
  if (!res.ok) {
    return { tasks: null, ok: false, auth: false };
  }
  const body = (await res.json()) as { data?: { onboardingTasks?: OnboardingTaskApi[] } };
  return { tasks: body.data?.onboardingTasks ?? [], ok: true, auth: false };
}

async function patchTask(
  bearerToken: string | null,
  taskId: string,
  status: "PENDING" | "IN_PROGRESS" | "DONE",
): Promise<boolean> {
  const res = await hrApiFetch("/api/v1/me/onboarding/tasks", {
    bearerToken,
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskId, status }),
  });
  return res.ok;
}

export function OnboardingTasksClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [tasks, setTasks] = useState<OnboardingTaskApi[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setTasks(undefined);
    });

    void (async () => {
      const result = await fetchOnboardingTasks(bearerToken);
      if (cancelled) return;
      if (!result.ok && result.auth) {
        setLoadError("auth");
        setTasks([]);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setTasks([]);
        return;
      }
      setTasks(result.tasks ?? []);
      setLoadError(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken]);

  const retryLoad = () => {
    if (!isAuthenticated) return;
    startTransition(() => {
      setLoadError(null);
      setTasks(undefined);
    });
    void (async () => {
      const result = await fetchOnboardingTasks(bearerToken);
      if (!result.ok && result.auth) {
        setLoadError("auth");
        setTasks([]);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setTasks([]);
        return;
      }
      setTasks(result.tasks ?? []);
      setLoadError(null);
    })();
  };

  const advanceTask = async (taskId: string, status: "IN_PROGRESS" | "DONE") => {
    if (!isAuthenticated) return;
    setBusyId(taskId);
    try {
      const ok = await patchTask(bearerToken, taskId, status);
      if (!ok) {
        setLoadError("recoverable");
        return;
      }
      const refreshed = await fetchOnboardingTasks(bearerToken);
      if (refreshed.ok && refreshed.tasks) {
        setTasks(refreshed.tasks);
      }
    } finally {
      setBusyId(null);
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
        title="Onboarding"
        description="Sign in to view your onboarding tasks."
        returnTo="/employee/onboarding"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (loadError === "recoverable") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Couldn&apos;t refresh onboarding tasks.</p>
        <Button type="button" onClick={() => retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loadError === "auth") {
    return <p className="text-sm text-muted-foreground">Sign in again to view onboarding.</p>;
  }

  if (tasks === undefined) {
    return <p className="text-sm text-muted-foreground">Loading onboarding checklist…</p>;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Your checklist</CardTitle>
        <CardDescription>
          Tasks HR expects during your first weeks. Update status as you go — this doesn&apos;t replace formal signatures where
          required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No onboarding tasks are assigned in the system yet. Your HR contact may still be setting things up.
          </p>
        ) : (
          <ul className="divide-y divide-border" role="list">
            {tasks.map((t) => (
              <li key={t.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium text-foreground">{t.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{labelStatus(t.status)}</div>
                  {t.dueAt ? (
                    <div className="mt-1 text-xs text-muted-foreground">Due {t.dueAt}</div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.status === "PENDING" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === t.id}
                      onClick={() => void advanceTask(t.id, "IN_PROGRESS")}
                    >
                      Start
                    </Button>
                  ) : null}
                  {t.status === "IN_PROGRESS" ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === t.id}
                      onClick={() => void advanceTask(t.id, "DONE")}
                    >
                      Mark done
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
