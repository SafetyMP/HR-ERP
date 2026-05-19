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

type Enrollment = {
  id: string;
  status: string;
  dueAt: string | null;
  completedAt: string | null;
  course: {
    id: string;
    code: string;
    title: string;
    estimatedDuration: string | null;
  };
};

type Props = {
  initialBearerToken?: string;
};

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  WAIVED: "Waived",
  EXPIRED: "Expired",
};

export function EmployeeLearningClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [rows, setRows] = useState<Enrollment[] | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const reload = async () => {
    const res = await hrApiFetch("/api/v1/me/learning/enrollments", {
      bearerToken,
      headers: { Accept: "application/json" },
    });
    if (res.status === 403) {
      setForbidden(true);
      setLoadFailed(false);
      setRows([]);
      return;
    }
    if (!res.ok) {
      setForbidden(false);
      setLoadFailed(true);
      setRows([]);
      return;
    }
    setForbidden(false);
    setLoadFailed(false);
    const body = (await res.json()) as { data?: { enrollments?: Enrollment[] } };
    setRows(body.data?.enrollments ?? []);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => setRows(undefined));
    void (async () => {
      await reload();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken]);

  const complete = async (id: string) => {
    setBusyId(id);
    setMsg(null);
    try {
      const res = await hrApiFetch(`/api/v1/me/learning/enrollments/${id}/complete`, {
        bearerToken,
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (res.status === 409) {
        setMsg("This enrollment is already completed or cannot be changed.");
        return;
      }
      if (!res.ok) {
        setMsg("Could not mark complete.");
        return;
      }
      await reload();
      setMsg("Marked complete.");
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

  if (forbidden) {
    return (
      <p className="text-sm text-muted-foreground">
        Your session cannot view learning enrollments. Sign in as an employee.
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="My learning"
        description="Sign in to view assigned courses and mark them complete."
        returnTo="/employee/learning"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned learning</CardTitle>
        <CardDescription>Courses assigned to you. Mark complete when finished.</CardDescription>
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

        {loadFailed ? (
          <p className="text-sm text-muted-foreground">
            Could not load enrollments.{" "}
            <Button type="button" variant="link" className="h-auto p-0" onClick={() => void reload()}>
              Retry
            </Button>
          </p>
        ) : null}
        {rows === undefined ? (
          <p className="text-sm text-muted-foreground">Loading enrollments…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No assignments yet. HR has not published courses for you.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border" role="list">
            {rows.map((e) => (
              <li key={e.id} className="list-none px-4 py-3 text-sm">
                <p className="font-medium text-foreground">{e.course.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {e.course.code}
                  {e.course.estimatedDuration ? ` · ${e.course.estimatedDuration}` : ""} ·{" "}
                  {STATUS_LABEL[e.status] ?? e.status}
                  {e.dueAt ? ` · due ${new Date(e.dueAt).toLocaleDateString()}` : ""}
                  {e.completedAt
                    ? ` · completed ${new Date(e.completedAt).toLocaleDateString()}`
                    : ""}
                </p>
                {e.status !== "COMPLETED" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    disabled={busyId === e.id}
                    onClick={() => void complete(e.id)}
                  >
                    {busyId === e.id ? "Saving…" : "Mark complete"}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </CardContent>
    </Card>
  );
}
