"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";
import {
  benefitLifeEventStatusLabel,
  benefitLifeEventTypeLabel,
} from "@/lib/ui/benefit-life-event-labels";

type LifeEvent = {
  id: string;
  eventType: string;
  eventDate: string;
  status: string;
  description: string | null;
};

type Props = { initialBearerToken?: string };

export function BenefitsLifeEventsClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [eventType, setEventType] = useState("MARRIAGE");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await hrApiFetch("/api/v1/me/benefits/life-events", {
      bearerToken,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const body = (await res.json()) as { data?: { events?: LifeEvent[] } };
    setEvents(body.data?.events ?? []);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      const res = await hrApiFetch("/api/v1/me/benefits/life-events", {
        bearerToken,
        headers: { Accept: "application/json" },
      });
      if (cancelled || !res.ok) return;
      const body = (await res.json()) as { data?: { events?: LifeEvent[] } };
      setEvents(body.data?.events ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken]);

  const submit = async () => {
    if (!eventDate) {
      setMsg("Please choose the date the life event occurred.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await hrApiFetch("/api/v1/me/benefits/life-events", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventType, eventDate, description }),
      });
      if (!res.ok) {
        setMsg("Could not submit — check the date and try again.");
        return;
      }
      setMsg("Submitted — HR will review your request.");
      setDescription("");
      setEventDate("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Checking session…</p>;
  }
  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="Benefits life events"
        description="Sign in to report a qualifying life event."
        returnTo="/employee/benefits/life-events"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Report a life event</CardTitle>
          <CardDescription>
            Marriage, birth, divorce, or loss of coverage — HR will review
            before changes apply to your elections.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="event-type">Event type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger id="event-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MARRIAGE">Marriage</SelectItem>
                <SelectItem value="BIRTH_ADOPTION">
                  Birth or adoption
                </SelectItem>
                <SelectItem value="DIVORCE">Divorce</SelectItem>
                <SelectItem value="LOSS_OF_COVERAGE">
                  Loss of coverage
                </SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-date">Event date</Label>
            <input
              id="event-date"
              type="date"
              required
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Details (optional)</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? "Submitting…" : "Submit life event"}
          </Button>
          {msg ? (
            <p className="text-sm text-muted-foreground" role="status">
              {msg}
            </p>
          ) : null}
          <Link
            href="/employee/benefits"
            className="text-sm text-primary underline"
          >
            Back to benefits summary
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No life events on file.
            </p>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {events.map((e) => (
                <li
                  key={e.id}
                  className="list-none flex flex-wrap items-center gap-2 py-3 text-sm"
                >
                  <span className="font-medium">
                    {benefitLifeEventTypeLabel(e.eventType)}
                  </span>
                  <span className="text-muted-foreground">{e.eventDate}</span>
                  <Badge variant="secondary">
                    {benefitLifeEventStatusLabel(e.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
