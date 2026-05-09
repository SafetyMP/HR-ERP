"use client";

import Link from "next/link";
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

export function BenefitsElectionIntentClient({ initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [category, setCategory] = useState<
    "MEDICAL" | "DENTAL" | "VISION" | "INCOME_PROTECTION" | "RETIREMENT"
  >("MEDICAL");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
    setMsg(null);
    try {
      const res = await fetch("/api/v1/me/benefits/election-change-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category, summary }),
      });
      if (!res.ok) {
        setMsg("Could not submit intent — check spelling length (min 8 chars).");
        return;
      }
      setMsg("Recorded — Benefits administration still validates eligibility & payroll cutoff dates.");
      setSummary("");
    } finally {
      setBusy(false);
    }
  };

  if (!token) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Tell Benefits what you want to change</CardTitle>
        <CardDescription>
          Captures intent only — carriers and payroll feeds update elsewhere. Contact your administrator for effective dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <label className="font-medium text-zinc-700 dark:text-zinc-300" htmlFor="ben-cat">
            Coverage area
          </label>
          <select
            id="ben-cat"
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
          >
            <option value="MEDICAL">Medical</option>
            <option value="DENTAL">Dental</option>
            <option value="VISION">Vision</option>
            <option value="INCOME_PROTECTION">Income protection</option>
            <option value="RETIREMENT">Retirement</option>
          </select>
        </div>
        <div>
          <label className="font-medium text-zinc-700 dark:text-zinc-300" htmlFor="ben-sum">
            Describe the change
          </label>
          <textarea
            id="ben-sum"
            rows={5}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Example: Switch medical tier from Silver to Gold effective next open enrollment."
          />
        </div>
        {msg ? <p className="text-zinc-700 dark:text-zinc-300">{msg}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy || summary.trim().length < 8} onClick={() => void submit()}>
            {busy ? "Sending…" : "Submit intent"}
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href="/employee/benefits">Back to Benefits summary</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
