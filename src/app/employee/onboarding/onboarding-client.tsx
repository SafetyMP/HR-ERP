"use client";

import {
  clearDevBearerTokenFromSession,
  readDevBearerTokenFromSession,
  writeDevBearerTokenToSession,
} from "@/lib/auth/dev-bearer-session";

import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


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

async function fetchOnboardingTasks(token: string): Promise<{
  tasks: OnboardingTaskApi[] | null;
  ok: boolean;
  auth: boolean;
}> {
  const res = await fetch("/api/v1/me/onboarding/tasks", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (res.status === 401) {
    return { tasks: null, ok: false, auth: true };
  }
  if (!res.ok) {
    return { tasks: null, ok: false, auth: false };
  }
  const body = (await res.json()) as { data?: { onboardingTasks?: OnboardingTaskApi[] } };
  return { tasks: body.data?.onboardingTasks ?? [], ok: true, auth: false };
}

async function patchTask(token: string, taskId: string, status: "PENDING" | "IN_PROGRESS" | "DONE"): Promise<boolean> {
  const res = await fetch("/api/v1/me/onboarding/tasks", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskId, status }),
  });
  return res.ok;
}

export function OnboardingTasksClient({ initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [tasks, setTasks] = useState<OnboardingTaskApi[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startTransition(() => {
      const fromStorage = readDevBearerTokenFromSession();
      if (fromStorage) setTokenState(fromStorage);
      else if (initialBearerToken?.trim()) {
        const t = writeDevBearerTokenToSession(initialBearerToken);
        if (t) setTokenState(t);
      }
    });
  }, [initialBearerToken]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setTasks(undefined);
    });

    void (async () => {
      const result = await fetchOnboardingTasks(token);
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
  }, [token]);

  const retryLoad = () => {
    if (!token) return;
    startTransition(() => {
      setLoadError(null);
      setTasks(undefined);
    });
    void (async () => {
      const result = await fetchOnboardingTasks(token);
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
    if (!token) return;
    setBusyId(taskId);
    try {
      const ok = await patchTask(token, taskId, status);
      if (!ok) {
        setLoadError("recoverable");
        return;
      }
      const refreshed = await fetchOnboardingTasks(token);
      if (refreshed.ok && refreshed.tasks) {
        setTasks(refreshed.tasks);
      }
    } finally {
      setBusyId(null);
    }
  };

  if (!token) return null;

  if (loadError === "recoverable") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Couldn&apos;t refresh onboarding tasks.</p>
        <Button type="button" onClick={() => retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loadError === "auth") {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Sign in again to view onboarding.</p>;
  }

  if (tasks === undefined) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading onboarding checklist…</p>;
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
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No onboarding tasks are assigned in the system yet. Your HR contact may still be setting things up.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800" role="list">
            {tasks.map((t) => (
              <li key={t.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium text-zinc-950 dark:text-zinc-50">{t.title}</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{labelStatus(t.status)}</div>
                  {t.dueAt ? (
                    <div className="mt-1 text-xs text-zinc-500">Due {t.dueAt}</div>
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
