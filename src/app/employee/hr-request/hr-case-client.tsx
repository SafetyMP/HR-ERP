"use client";

import { startTransition, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STORAGE_KEY = "hrerp_bearer_token";

type Props = {
  initialBearerToken?: string;
};

export function HrCaseRequestClient({ initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [category, setCategory] = useState<"PAYROLL" | "BENEFITS" | "HR_OTHER">("PAYROLL");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startTransition(() => {
      const fromStorage = sessionStorage.getItem(STORAGE_KEY)?.trim();
      if (fromStorage) setTokenState(fromStorage);
      else if (initialBearerToken?.trim()) {
        sessionStorage.setItem(STORAGE_KEY, initialBearerToken.trim());
        setTokenState(initialBearerToken.trim());
      }
    });
  }, [initialBearerToken]);

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
          <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
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
  );
}
