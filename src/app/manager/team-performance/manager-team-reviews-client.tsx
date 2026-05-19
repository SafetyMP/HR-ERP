"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

type Review = {
  id: string;
  employeeName: string;
  status: string;
  selfRating: number | null;
  selfNote: string | null;
  managerRating: number | null;
  managerNote: string | null;
};

type Cycle = {
  name: string;
  startDate: string;
  endDate: string;
};

export function ManagerTeamReviewsClient() {
  const { bearerToken, isAuthenticated } = useHrAccess();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const res = await hrApiFetch("/api/v1/manager/performance/reviews", {
      bearerToken,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const body = (await res.json()) as {
      data?: { cycle?: Cycle | null; reviews?: Review[] };
    };
    setCycle(body.data?.cycle ?? null);
    const list = body.data?.reviews ?? [];
    setReviews(list);
    const nextRatings: Record<string, number> = {};
    const nextNotes: Record<string, string> = {};
    for (const r of list) {
      nextRatings[r.id] = r.managerRating ?? 3;
      nextNotes[r.id] = r.managerNote ?? "";
    }
    setRatings(nextRatings);
    setNotes(nextNotes);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, bearerToken]);

  const submit = async (id: string) => {
    const managerRating = ratings[id] ?? 3;
    await hrApiFetch(`/api/v1/manager/performance/reviews/${id}`, {
      bearerToken,
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        managerRating,
        managerNote: notes[id]?.trim() || undefined,
      }),
    });
    await load();
  };

  if (!cycle) return null;
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No direct reports with reviews in this cycle.</p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team reviews — {cycle.name}</CardTitle>
        <CardDescription>
          {cycle.startDate} — {cycle.endDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {reviews.map((r) => {
          const canSubmit =
            r.status === "EMPLOYEE_SUBMITTED" || r.status === "DRAFT";
          return (
            <div
              key={r.id}
              className="rounded-lg border border-border p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{r.employeeName}</p>
                <Badge variant="secondary">{r.status.replaceAll("_", " ")}</Badge>
              </div>
              {r.selfRating != null ? (
                <p className="mt-2 text-muted-foreground">
                  Self rating: {r.selfRating}/5
                  {r.selfNote ? ` — ${r.selfNote}` : ""}
                </p>
              ) : (
                <p className="mt-2 text-muted-foreground">Self review not submitted yet.</p>
              )}
              <div className="mt-3 flex flex-col gap-2">
                <label className="text-xs font-medium">
                  Manager rating (1–5)
                  <input
                    type="number"
                    min={1}
                    max={5}
                    disabled={!canSubmit}
                    className="mt-1 block w-16 rounded border border-border px-2 py-1 disabled:opacity-60"
                    value={ratings[r.id] ?? 3}
                    onChange={(e) =>
                      setRatings((prev) => ({
                        ...prev,
                        [r.id]: Number(e.target.value),
                      }))
                    }
                  />
                </label>
                <label className="text-xs font-medium">
                  Manager note
                  <textarea
                    className="mt-1 block w-full rounded-md border border-border px-2 py-1 disabled:opacity-60"
                    rows={2}
                    disabled={!canSubmit}
                    value={notes[r.id] ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                  />
                </label>
                {canSubmit ? (
                  <Button
                    type="button"
                    size="sm"
                    className="self-start"
                    onClick={() => void submit(r.id)}
                  >
                    Submit manager review
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
