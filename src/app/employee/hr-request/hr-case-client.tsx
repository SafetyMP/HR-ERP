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


type CaseRow = {
  id: string;
  category: string;
  status: string;
  bodyPreview: string;
  employeeVisibleNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initialBearerToken?: string;
};

function statusPlain(status: string): string {
  switch (status) {
    case "OPEN":
      return "Submitted — awaiting HR";
    case "ACKNOWLEDGED":
      return "Acknowledged";
    case "NEEDS_INFO":
      return "HR needs more information";
    case "RESOLVED":
      return "Resolved";
    default:
      return status;
  }
}

async function fetchCases(token: string): Promise<{ rows: CaseRow[] | null; ok: boolean }> {
  const res = await fetch("/api/v1/me/hr-case-requests", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) return { rows: null, ok: false };
  const body = (await res.json()) as { data?: { hrCaseRequests?: CaseRow[] } };
  return { rows: body.data?.hrCaseRequests ?? [], ok: true };
}

export function HrCaseRequestClient({ initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [category, setCategory] = useState<"PAYROLL" | "BENEFITS" | "HR_OTHER">("PAYROLL");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseRow[] | undefined>(undefined);
  const [casesError, setCasesError] = useState(false);

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
    startTransition(() => {
      setCases(undefined);
      setCasesError(false);
    });
    void (async () => {
      const result = await fetchCases(token);
      if (cancelled) return;
      if (!result.ok || result.rows === null) {
        setCasesError(true);
        setCases([]);
        return;
      }
      setCases(result.rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, sent]);

  const reloadCases = () => {
    if (!token) return;
    startTransition(() => {
      setCases(undefined);
      setCasesError(false);
    });
    void (async () => {
      const result = await fetchCases(token);
      if (!result.ok || result.rows === null) {
        setCasesError(true);
        setCases([]);
        return;
      }
      setCases(result.rows);
    })();
  };

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/me/hr-case-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category, body }),
      });
      if (!res.ok) {
        setError("We couldn't send your message. Try again or reach HR another way.");
        return;
      }
      setSent(true);
      setBody("");
    } finally {
      setBusy(false);
    }
  };

  if (!token) return null;

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Your requests</CardTitle>
          <CardDescription>
            Status updates and short HR notes appear here when triage moves forward — not a full ticketing system yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {casesError ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Couldn&apos;t load your history.{" "}
              <button type="button" className="underline" onClick={() => reloadCases()}>
                Retry
              </button>
            </p>
          ) : cases === undefined ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
          ) : cases.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No structured requests logged yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800" role="list">
              {cases.map((c) => (
                <li key={c.id} className="py-3 text-sm">
                  <div className="font-medium text-zinc-950 dark:text-zinc-50">{c.category.replace(/_/g, " ")}</div>
                  <div className="mt-1 text-zinc-600 dark:text-zinc-400">{statusPlain(c.status)}</div>
                  <div className="mt-2 text-zinc-700 dark:text-zinc-300">{c.bodyPreview}</div>
                  {c.employeeVisibleNote ? (
                    <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      HR note: {c.employeeVisibleNote}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Message HR / Payroll</CardTitle>
          <CardDescription>
            Lightweight intake so HR Operations sees structured requests. Not for emergencies — call your published HR hotline when
            time-sensitive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <div
              role="status"
              className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
            >
              Thanks — your note was logged for HR review. Keep any payroll correspondence IDs your payroll team sends separately.
            </div>
          ) : null}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="case-cat">
              Topic
            </label>
            <select
              id="case-cat"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
            >
              <option value="PAYROLL">Payroll</option>
              <option value="BENEFITS">Benefits</option>
              <option value="HR_OTHER">Other HR</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="case-body">
              What do you need?
            </label>
            <textarea
              id="case-body"
              rows={5}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Include dates, amounts, or policy names if helpful — avoid sharing full bank or government IDs here."
            />
          </div>
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <Button type="button" disabled={busy || body.trim().length < 8} onClick={() => void submit()}>
            {busy ? "Sending…" : "Submit to HR"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
