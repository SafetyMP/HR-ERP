"use client";

import {
  clearDevBearerTokenFromSession,
  readDevBearerTokenFromSession,
  writeDevBearerTokenToSession,
} from "@/lib/auth/dev-bearer-session";

import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


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
  const [token, setTokenState] = useState<string | null>(null);
  const [rows, setRows] = useState<DocRow[] | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startTransition(() => {
      const fromStorage = readDevBearerTokenFromSession();
      if (fromStorage) setTokenState(fromStorage);
      else if (initialBearerToken?.trim()) {
        const t = writeDevBearerTokenToSession(initialBearerToken);
        if (t) setTokenState(t);
      }
    });
  }, [initialBearerToken]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    startTransition(() => setRows(undefined));
    void (async () => {
      const res = await fetch("/api/v1/me/tax-documents/summary", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
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
  }, [token]);

  if (!token) return null;

  if (rows === undefined) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading tax summaries…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Year-end artifacts availability — download wiring stays vendor-specific; rows explain what payroll posted for self‑service visibility.
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
                <CardContent className="text-sm text-zinc-700 dark:text-zinc-300">
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
