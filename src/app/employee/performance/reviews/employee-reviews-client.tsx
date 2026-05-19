"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

type Review = {
  id: string;
  status: string;
  selfRating: number | null;
  selfNote: string | null;
};

type Cycle = {
  name: string;
  startDate: string;
  endDate: string;
};

type Props = { initialBearerToken?: string };

export function EmployeeReviewsClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [review, setReview] = useState<Review | null>(null);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [rating, setRating] = useState(3);
  const [note, setNote] = useState("");

  const load = async () => {
    const res = await hrApiFetch("/api/v1/me/performance/reviews", {
      bearerToken,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const body = (await res.json()) as {
      data?: { cycle?: Cycle | null; reviews?: Review[] };
    };
    const c = body.data?.cycle ?? null;
    setCycle(c);
    const r = body.data?.reviews?.[0] ?? null;
    setReview(r);
    if (r?.selfRating != null) setRating(r.selfRating);
    if (r?.selfNote) setNote(r.selfNote);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, bearerToken]);

  const canSubmit = review?.status === "DRAFT";

  const submit = async () => {
    if (!review || !canSubmit) return;
    await hrApiFetch(`/api/v1/me/performance/reviews/${review.id}`, {
      bearerToken,
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selfRating: rating, selfNote: note }),
    });
    await load();
  };

  if (!ready) return <p className="text-sm text-muted-foreground">Checking session…</p>;
  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="Performance review"
        description="Sign in to complete your self review."
        returnTo="/employee/performance/reviews"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (!cycle) {
    return (
      <p className="text-sm text-muted-foreground">
        No open performance cycle.{" "}
        <Link href="/employee/performance/goals" className="text-primary underline">
          View goals
        </Link>
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cycle.name}</CardTitle>
        <CardDescription>
          {cycle.startDate} — {cycle.endDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {review ? (
          <>
            <Badge variant="secondary">{review.status.replaceAll("_", " ")}</Badge>
            <label className="text-sm">
              Self rating (1–5)
              <input
                type="number"
                min={1}
                max={5}
                disabled={!canSubmit}
                className="mt-1 block w-24 rounded-md border border-border px-2 py-1 disabled:opacity-60"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              />
            </label>
            <label className="text-sm">
              Self note
              <textarea
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 disabled:opacity-60"
                rows={4}
                disabled={!canSubmit}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            {canSubmit ? (
              <Button type="button" onClick={() => void submit()}>
                Submit self review
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your self review is submitted.{" "}
                <Link href="/employee/performance/goals" className="underline">
                  View goals
                </Link>
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
