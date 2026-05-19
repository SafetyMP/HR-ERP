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


type TaskApi = {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
};

type Props = {
  initialBearerToken?: string;
};

async function fetchSeparationTasks(bearerToken: string | null): Promise<{
  tasks: TaskApi[] | null;
  ok: boolean;
  auth: boolean;
}> {
  const res = await hrApiFetch("/api/v1/me/separation/tasks", {
    bearerToken,
    headers: { Accept: "application/json" },
  });
  if (res.status === 401) return { tasks: null, ok: false, auth: true };
  if (!res.ok) return { tasks: null, ok: false, auth: false };
  const body = (await res.json()) as { data?: { separationTasks?: TaskApi[] } };
  return { tasks: body.data?.separationTasks ?? [], ok: true, auth: false };
}

async function patchSeparationTask(
  bearerToken: string | null,
  taskId: string,
  status: "PENDING" | "IN_PROGRESS" | "DONE",
): Promise<boolean> {
  const res = await hrApiFetch("/api/v1/me/separation/tasks", {
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

export function SeparationTasksClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [tasks, setTasks] = useState<TaskApi[] | undefined>(undefined);
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
      const result = await fetchSeparationTasks(bearerToken);
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
      const result = await fetchSeparationTasks(bearerToken);
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
      const ok = await patchSeparationTask(bearerToken, taskId, status);
      if (!ok) {
        setLoadError("recoverable");
        return;
      }
      const refreshed = await fetchSeparationTasks(bearerToken);
      if (refreshed.ok && refreshed.tasks) setTasks(refreshed.tasks);
    } finally {
      setBusyId(null);
    }
  };

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
        title="Separation"
        description="Sign in to view your separation checklist."
        returnTo="/employee/leaving"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (loadError === "recoverable") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Couldn&apos;t refresh leaving checklist.</p>
        <Button type="button" onClick={() => retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loadError === "auth") {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Session issue — sign in again.</p>;
  }

  if (tasks === undefined) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Loading leaving checklist…
      </p>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Leaving checklist</CardTitle>
        <CardDescription>Tasks HR assigns when you transition off payroll — keep receipts aligned with policy.</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No separation tasks assigned — if you&apos;re exiting soon, confirm HR opened your checklist.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800" role="list">
            {tasks.map((task) => (
              <li key={task.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium text-zinc-950 dark:text-zinc-50">{task.title}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{task.status.replace(/_/g, " ")}</div>
                  {task.dueAt ? (
                    <div className="mt-1 text-xs text-zinc-500">Due {task.dueAt}</div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {task.status === "PENDING" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busyId === task.id}
                      onClick={() => void advanceTask(task.id, "IN_PROGRESS")}
                    >
                      Start
                    </Button>
                  ) : null}
                  {task.status === "IN_PROGRESS" ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === task.id}
                      onClick={() => void advanceTask(task.id, "DONE")}
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
