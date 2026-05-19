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

type DocRow = {
  id: string;
  taxYear: number;
  documentKind: string;
  title: string;
  availabilityNote: string | null;
};

type Props = {
  initialBearerToken?: string;
};

export function TaxDocumentsClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } = useHrAccess(initialBearerToken);
  const [rows, setRows] = useState<DocRow[] | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => setRows(undefined));
    void (async () => {
      const res = await hrApiFetch("/api/v1/me/tax-documents/summary", {
        bearerToken,
        headers: { Accept: "application/json" },
      });
      if (cancelled) return;
      if (!res.ok) {
        setRows([]);
        return;
      }
      const body = (await res.json()) as { data?: { taxDocuments?: DocRow[] } };
      setRows(body.data?.taxDocuments ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken]);

  if (!ready) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Checking your session…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="Tax documents"
        description="Sign in to view your year-end tax summaries."
        returnTo="/employee/tax-documents"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (rows === undefined) {
    return <p className="text-sm text-muted-foreground">Loading tax summaries…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Year-end artifacts availability — download wiring stays vendor-specific; rows explain what payroll posted for
        self‑service visibility.
      </p>
      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No tax summaries yet</CardTitle>
            <CardDescription>Rows appear after payroll seeds documentation metadata.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3" role="list">
          {rows.map((r) => (
            <li key={r.id}>
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {r.title} ({r.taxYear})
                  </CardTitle>
                  <CardDescription>{r.documentKind.replace(/_/g, " ")}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-foreground">
                  {r.availabilityNote ?? "No availability note on file."}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Button variant="outline" type="button" onClick={() => window.location.assign("/employee/paystub")}>
        Back to earnings statement
      </Button>
    </div>
  );
}
