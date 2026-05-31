"use client";

import Link from "next/link";
import { useState } from "react";

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

type Props = {
  initialBearerToken?: string;
};

export function BenefitsElectionIntentClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } = useHrAccess(initialBearerToken);
  const [category, setCategory] = useState<
    "MEDICAL" | "DENTAL" | "VISION" | "INCOME_PROTECTION" | "RETIREMENT"
  >("MEDICAL");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    if (!isAuthenticated) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await hrApiFetch("/api/v1/me/benefits/election-change-requests", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category, summary }),
      });
      if (!res.ok) {
        setMsg("Could not submit intent — check spelling length (min 8 chars).");
        return;
      }
      const body = (await res.json()) as {
        data?: { benefitElectionChangeRequest?: { id: string; createdAt: string } };
      };
      const row = body.data?.benefitElectionChangeRequest;
      const ref = row?.id ? `Request ${row.id.slice(0, 8)}…` : "Request recorded";
      const when = row?.createdAt ? ` at ${new Date(row.createdAt).toLocaleString()}` : "";
      setMsg(`${ref}${when} — Benefits administration validates eligibility and payroll cutoff dates.`);
      setSummary("");
    } finally {
      setBusy(false);
    }
  };

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
        title="Benefits election change"
        description="Sign in to tell Benefits what coverage change you want."
        returnTo="/employee/benefits/election-change"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Tell Benefits what you want to change</CardTitle>
        <CardDescription>
          Captures intent only — carriers and payroll feeds update elsewhere. Contact your administrator for effective
          dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <label className="font-medium text-foreground" htmlFor="ben-cat">
            Coverage area
          </label>
          <select
            id="ben-cat"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
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
          <label className="font-medium text-foreground" htmlFor="ben-sum">
            Describe the change
          </label>
          <textarea
            id="ben-sum"
            rows={5}
            className="mt-1 w-full rounded-md border border-border bg-background p-2"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Example: Switch medical tier from Silver to Gold effective next open enrollment."
          />
        </div>
        {msg ? <p className="text-foreground">{msg}</p> : null}
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
