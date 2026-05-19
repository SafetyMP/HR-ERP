"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { toast } from "sonner";

type Interview = {
  id: string;
  scheduledAt: string;
  interviewType: string;
  outcome: string;
  scorecardJson?: { rating?: number; notes?: string };
};

type Props = {
  applicationId: string;
  candidateName: string;
  bearerToken: string | null;
};

export function ApplicationInterviewsPanel({
  applicationId,
  candidateName,
  bearerToken,
}: Props) {
  const [open, setOpen] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
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
    if (!scheduledAt) {
      toast.error("Choose a date and time for the interview.");
      return;
    }
    setBusy(true);
    try {
      const iso = new Date(scheduledAt).toISOString();
      const res = await hrApiFetch(
        `/api/v1/recruiting/applications/${applicationId}/interviews`,
        {
          bearerToken,
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ scheduledAt: iso, interviewType }),
        },
      );
      if (!res.ok) {
        toast.error("Could not schedule interview.");
        return;
      }
      toast.success("Interview scheduled.");
      setScheduledAt("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const completeInterview = async (id: string) => {
    setBusy(true);
    try {
      const res = await hrApiFetch(`/api/v1/recruiting/interviews/${id}`, {
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
      if (!res.ok) {
        toast.error("Could not save scorecard.");
        return;
      }
      toast.success("Scorecard saved.");
      setScorecardId(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Interviews ({interviews.length || "…"})
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Interviews — {candidateName}</SheetTitle>
          <SheetDescription>Schedule sessions and record scorecards.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {interviews.map((iv) => (
            <div key={iv.id} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">
                {iv.interviewType} · {new Date(iv.scheduledAt).toLocaleString()}
              </p>
              <Badge variant="secondary" className="mt-1">
                {iv.outcome}
              </Badge>
              {iv.outcome === "SCHEDULED" && scorecardId === iv.id ? (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Button
                        key={n}
                        type="button"
                        size="sm"
                        variant={rating === n ? "default" : "outline"}
                        onClick={() => setRating(n)}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                  <Textarea
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
                <p className="mt-2 text-muted-foreground">
                  Score: {iv.scorecardJson.rating}/5
                  {iv.scorecardJson.notes ? ` — ${iv.scorecardJson.notes}` : ""}
                </p>
              ) : null}
            </div>
          ))}
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <Input
              placeholder="Interview type"
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
            />
            <Button type="button" disabled={busy} onClick={() => void schedule()}>
              Schedule interview
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
