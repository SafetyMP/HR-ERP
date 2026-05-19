"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";

type Interview = {
  id: string;
  scheduledAt: string;
  interviewType: string;
  outcome: string;
  scorecardJson?: { rating?: number; notes?: string };
};

type Props = {
  applicationId: string;
  bearerToken: string | null;
};

export function ApplicationInterviewsPanel({ applicationId, bearerToken }: Props) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [interviewType, setInterviewType] = useState("Phone screen");
  const [busy, setBusy] = useState(false);
  const [scorecardId, setScorecardId] = useState<string | null>(null);
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");

  const load = async () => {
    const res = await hrApiFetch(
      `/api/v1/recruiting/applications/${applicationId}/interviews`,
      { bearerToken, headers: { Accept: "application/json" } },
    );
    if (!res.ok) {
      setInterviews([]);
      return;
    }
    const body = (await res.json()) as { data?: { interviews?: Interview[] } };
    setInterviews(body.data?.interviews ?? []);
  };

  useEffect(() => {
    if (open) void load();
  }, [open, applicationId, bearerToken]);

  const schedule = async () => {
    if (!scheduledAt) return;
    setBusy(true);
    try {
      const iso = new Date(scheduledAt).toISOString();
      await hrApiFetch(`/api/v1/recruiting/applications/${applicationId}/interviews`, {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scheduledAt: iso, interviewType }),
      });
      setScheduledAt("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const completeInterview = async (id: string) => {
    setBusy(true);
    try {
      await hrApiFetch(`/api/v1/recruiting/interviews/${id}`, {
        bearerToken,
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outcome: "COMPLETED",
          scorecardJson: { rating, notes },
        }),
      });
      setScorecardId(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <details
      className="mt-3 rounded-md border border-dashed border-border p-3"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
        Interviews ({interviews.length})
      </summary>
      <div className="mt-3 space-y-3">
        {interviews.map((iv) => (
          <div key={iv.id} className="text-xs">
            <p className="font-medium">
              {iv.interviewType} · {new Date(iv.scheduledAt).toLocaleString()}
            </p>
            <Badge variant="secondary" className="mt-1">
              {iv.outcome}
            </Badge>
            {iv.outcome === "SCHEDULED" && scorecardId === iv.id ? (
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2">
                  Rating (1–5)
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="w-14 rounded border px-1"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  />
                </label>
                <textarea
                  className="w-full rounded border border-border px-2 py-1"
                  rows={2}
                  placeholder="Scorecard notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => void completeInterview(iv.id)}
                >
                  Save scorecard
                </Button>
              </div>
            ) : iv.outcome === "SCHEDULED" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setScorecardId(iv.id);
                  setRating(3);
                  setNotes("");
                }}
              >
                Complete scorecard
              </Button>
            ) : null}
            {iv.scorecardJson?.rating ? (
              <p className="mt-1 text-muted-foreground">
                Score: {iv.scorecardJson.rating}/5
                {iv.scorecardJson.notes ? ` — ${iv.scorecardJson.notes}` : ""}
              </p>
            ) : null}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Input
            type="datetime-local"
            className="max-w-[12rem] text-xs"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <Input
            placeholder="Type"
            className="max-w-[8rem] text-xs"
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value)}
          />
          <Button type="button" size="sm" disabled={busy} onClick={() => void schedule()}>
            Schedule
          </Button>
        </div>
      </div>
    </details>
  );
}
