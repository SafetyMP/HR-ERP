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
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

export type TimeOffRequestApiItem = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  note: string | null;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
};

type Props = {
  initialBearerToken?: string;
};

function statusLabel(s: string): string {
  switch (s) {
    case "PENDING":
      return "Pending review";
    case "APPROVED":
      return "Approved";
    case "DENIED":
      return "Denied";
    default:
      return s;
  }
}

function formatDay(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(`${isoDate}T12:00:00.000Z`),
  );
}

async function fetchTimeOffRequests(bearerToken: string | null): Promise<{
  items: TimeOffRequestApiItem[] | null;
  ok: boolean;
  auth: boolean;
  forbidden: boolean;
}> {
  const res = await hrApiFetch("/api/v1/me/time-off/requests", {
    bearerToken,
    headers: { Accept: "application/json" },
  });
  if (res.status === 401) {
    return { items: null, ok: false, auth: true, forbidden: false };
  }
  if (res.status === 403) {
    return { items: null, ok: false, auth: false, forbidden: true };
  }
  if (!res.ok) {
    return { items: null, ok: false, auth: false, forbidden: false };
  }
  const body = (await res.json()) as { data?: { timeOffRequests?: TimeOffRequestApiItem[] } };
  return {
    items: body.data?.timeOffRequests ?? [],
    ok: true,
    auth: false,
    forbidden: false,
  };
}

export function TimeOffRequestsPanel({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated } = useHrAccess(initialBearerToken);
  const [items, setItems] = useState<TimeOffRequestApiItem[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | "forbidden" | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setItems(undefined);
    });

    void (async () => {
      const result = await fetchTimeOffRequests(bearerToken);
      if (cancelled) return;
      if (!result.ok && result.auth) {
        setLoadError("auth");
        setItems([]);
        return;
      }
      if (!result.ok && result.forbidden) {
        setLoadError("forbidden");
        setItems([]);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setItems([]);
        return;
      }
      setItems(result.items ?? []);
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
      setItems(undefined);
    });
    void (async () => {
      const result = await fetchTimeOffRequests(bearerToken);
      if (!result.ok && result.auth) {
        setLoadError("auth");
        setItems([]);
        return;
      }
      if (!result.ok && result.forbidden) {
        setLoadError("forbidden");
        setItems([]);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setItems([]);
        return;
      }
      setItems(result.items ?? []);
      setLoadError(null);
    })();
  };

  const submit = async () => {
    if (!isAuthenticated || !startDate || !endDate) return;
    setSubmitBusy(true);
    try {
      const res = await hrApiFetch("/api/v1/me/time-off/requests", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          note: note.trim() || undefined,
        }),
      });
      if (res.status === 401) {
        setLoadError("auth");
        return;
      }
      if (res.status === 403) {
        setLoadError("forbidden");
        return;
      }
      if (!res.ok) {
        setLoadError("recoverable");
        return;
      }
      setNote("");
      const refreshed = await fetchTimeOffRequests(bearerToken);
      if (refreshed.ok && refreshed.items) {
        setItems(refreshed.items);
      }
    } finally {
      setSubmitBusy(false);
    }
  };

  if (!ready) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading time-off requests…
      </p>
    );
  }

  if (!isAuthenticated) return null;

  if (loadError === "auth") {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Time-off requests</CardTitle>
          <CardDescription>Your session could not be verified. Sign in again.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loadError === "forbidden") {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Time-off requests</CardTitle>
          <CardDescription>
            Your account can&apos;t submit electronic time-off requests yet. Use your usual HR or manager channel instead.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loadError === "recoverable") {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Time-off requests</CardTitle>
          <CardDescription>We couldn&apos;t load your requests. Try again shortly.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => retryLoad()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items === undefined) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading time-off requests…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Request time off</CardTitle>
          <CardDescription>
            Submit a date range (up to 14 calendar days). Your manager records approve or deny decisions on{" "}
            <span className="font-medium">Team leave decisions</span> — notes appear here when decided.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="leave-start">
                First day away
              </label>
              <input
                id="leave-start"
                type="date"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="leave-end">
                Last day away
              </label>
              <input
                id="leave-end"
                type="date"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="leave-note">
              Note for your manager (optional)
            </label>
            <textarea
              id="leave-note"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Family trip — mobile if needed."
            />
          </div>
          <Button type="button" disabled={submitBusy || !startDate || !endDate} onClick={() => void submit()}>
            {submitBusy ? "Sending…" : "Submit request"}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Your submitted requests</CardTitle>
          <CardDescription>Newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests submitted from this portal yet.</p>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {items.map((row) => (
                <li key={row.id} className="py-3 text-sm">
                  <div className="font-medium text-foreground">
                    {formatDay(row.startDate)} — {formatDay(row.endDate)}
                  </div>
                  <div className="mt-1 text-muted-foreground">{statusLabel(row.status)}</div>
                  {row.decisionNote ? (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Manager note: {row.decisionNote}
                    </div>
                  ) : null}
                  {row.note ? (
                    <div className="mt-2 text-foreground">&ldquo;{row.note}&rdquo;</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
