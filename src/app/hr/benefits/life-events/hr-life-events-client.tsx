"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";
import {
  benefitLifeEventStatusLabel,
  benefitLifeEventTypeLabel,
} from "@/lib/ui/benefit-life-event-labels";
import { toast } from "sonner";

type EventRow = {
  id: string;
  employeeName: string;
  eventType: string;
  eventDate: string;
  status: string;
  description: string | null;
  carrierDeliveryStatus?: string | null;
  carrierDeliveryError?: string | null;
};

type Props = { initialBearerToken?: string };

export function HrLifeEventsClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [hrNotes, setHrNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const res = await hrApiFetch("/api/v1/hr/benefits/life-events", {
      bearerToken,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      setEvents([]);
      return;
    }
    const body = (await res.json()) as { data?: { events?: EventRow[] } };
    setEvents(body.data?.events ?? []);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, bearerToken]);

  const decide = async (id: string, decision: "APPLIED" | "DENIED") => {
    setBusyId(id);
    try {
      const res = await hrApiFetch(`/api/v1/hr/benefits/life-events/${id}`, {
        bearerToken,
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          decision,
          hrNote: hrNotes[id]?.trim() || undefined,
        }),
      });
      if (res.ok && decision === "APPLIED") {
        const body = (await res.json()) as {
          data?: { carrierDeliveryStatus?: string | null };
        };
        const status = body.data?.carrierDeliveryStatus ?? "PENDING";
        toast.success(`Life event approved — carrier delivery ${status.toLowerCase()}.`);
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (!ready) return <p className="text-sm text-muted-foreground">Checking session…</p>;
  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="Life event queue"
        description="Sign in as HR to review life events."
        returnTo="/hr/benefits/life-events"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending life events</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Queue is empty.{" "}
              <Link href="/hr/dashboard" className="text-primary underline">
                Return to dashboard
              </Link>
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium">Employee</th>
                    <th className="px-3 py-2 font-medium">Event</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="border-b border-border align-top">
                      <td className="px-3 py-3 font-medium">{e.employeeName}</td>
                      <td className="px-3 py-3">{benefitLifeEventTypeLabel(e.eventType)}</td>
                      <td className="px-3 py-3 tabular-nums">{e.eventDate}</td>
                      <td className="px-3 py-3">
                        <Badge variant="warning">
                          {benefitLifeEventStatusLabel(e.status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        {e.description ? (
                          <p className="mb-2 text-xs text-muted-foreground">{e.description}</p>
                        ) : null}
                        <textarea
                          placeholder="HR note (optional)"
                          className="mb-2 w-full min-w-[12rem] rounded-md border border-border bg-background px-2 py-1 text-xs"
                          rows={2}
                          value={hrNotes[e.id] ?? ""}
                          onChange={(ev) =>
                            setHrNotes((prev) => ({ ...prev, [e.id]: ev.target.value }))
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={busyId === e.id}
                            onClick={() => void decide(e.id, "APPLIED")}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busyId === e.id}
                            onClick={() => void decide(e.id, "DENIED")}
                          >
                            Deny
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
