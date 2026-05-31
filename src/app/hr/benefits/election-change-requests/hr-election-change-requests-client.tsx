"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

type RequestRow = {
  id: string;
  employeeName: string;
  categoryLabel: string;
  summary: string;
  status: string;
  createdAt: string;
};

type Props = { initialBearerToken?: string };

export function HrElectionChangeRequestsClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const [requests, setRequests] = useState<RequestRow[] | null>(null);

  const load = async () => {
    const res = await hrApiFetch("/api/v1/hr/benefits/election-change-requests", {
      bearerToken,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      setRequests([]);
      return;
    }
    const body = (await res.json()) as { data?: { requests?: RequestRow[] } };
    setRequests(body.data?.requests ?? []);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, bearerToken]);

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Checking session…</p>;
  }

  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="Election change queue"
        description="Sign in as HR to review pending election change intents."
        returnTo="/hr/benefits/election-change-requests"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (requests === null) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">Loading election change requests…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Election change requests</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Employee-submitted intents awaiting Benefits review. Fulfillment stays outside carrier feeds until
            processed.
          </p>
        </div>
        {requests.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No pending requests</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              When employees submit election change intents from self-service, they appear here.
            </CardContent>
          </Card>
        ) : (
          requests.map((row) => (
            <Card key={row.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{row.employeeName}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{row.categoryLabel}</p>
                </div>
                <Badge variant="secondary">{row.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{row.summary}</p>
                <p className="text-muted-foreground">
                  Request {row.id.slice(0, 8)}… · {new Date(row.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/hr/dashboard">Back to HR dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
