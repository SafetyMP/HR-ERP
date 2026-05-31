"use client";

import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";
import { readApiErrorMessage } from "@/lib/api/v1/read-api-error-message";

type Requisition = {
  id: string;
  title: string;
  status: string;
  openings: number;
  employmentType: string;
  locationCountry: string | null;
};

type Props = {
  initialBearerToken?: string;
};

const STAGE_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export { STAGE_LABEL };

async function fetchRequisitions(bearerToken: string | null) {
  const res = await hrApiFetch("/api/v1/recruiting/requisitions", {
    bearerToken,
    headers: { Accept: "application/json" },
  });
  if (res.status === 403) return { rows: null as Requisition[] | null, forbidden: true, failed: false };
  if (!res.ok) return { rows: null, forbidden: false, failed: true };
  const body = (await res.json()) as { data?: { requisitions?: Requisition[] } };
  return { rows: body.data?.requisitions ?? [], forbidden: false, failed: false };
}

export function ManagerRecruitingClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [rows, setRows] = useState<Requisition[] | undefined>(undefined);
  const [forbidden, setForbidden] = useState(false);
  const [title, setTitle] = useState("");
  const [openings, setOpenings] = useState("1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const reload = async () => {
    const result = await fetchRequisitions(bearerToken);
    if (result.forbidden) {
      setForbidden(true);
      setLoadFailed(false);
      setRows([]);
      return;
    }
    setLoadFailed(result.failed);
    setRows(result.rows ?? []);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => {
      setRows(undefined);
      setForbidden(false);
    });
    void (async () => {
      const result = await fetchRequisitions(bearerToken);
      if (cancelled) return;
      if (result.forbidden) {
        setForbidden(true);
        setLoadFailed(false);
        setRows([]);
        return;
      }
      setLoadFailed(result.failed);
      setRows(result.rows ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken]);

  const createReq = async () => {
    if (!title.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await hrApiFetch("/api/v1/recruiting/requisitions", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          openings: Number(openings) || 1,
          employmentType: "FULL_TIME",
        }),
      });
      if (!res.ok) {
        setMsg(
          await readApiErrorMessage(
            res,
            "Could not create requisition. Check your permissions and try again.",
          ),
        );
        return;
      }
      setTitle("");
      await reload();
      setMsg("Requisition created.");
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
        title="Recruiting"
        description="Sign in as a hiring manager or HR user with recruiting access."
        returnTo="/manager/recruiting"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (forbidden) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Your account cannot view recruiting requisitions. Use a manager or HR admin dev JWT.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>New requisition</CardTitle>
          <CardDescription>Post an open role for your team.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="text-sm font-medium text-foreground">
            Job title
            <Input
              className="mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Payroll Specialist"
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            Openings
            <Input
              className="mt-1 w-24"
              type="number"
              min={1}
              value={openings}
              onChange={(e) => setOpenings(e.target.value)}
            />
          </label>
          <Button type="button" onClick={() => void createReq()} disabled={busy}>
            {busy ? "Creating…" : "Create requisition"}
          </Button>
          {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requisitions</CardTitle>
          <CardDescription>Select a role to view the applicant pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void reload()}>
              Reload
            </Button>
          </div>
          {loadFailed ? (
            <p className="text-sm text-muted-foreground mb-4">
              Could not load requisitions.{" "}
              <Button type="button" variant="link" className="h-auto p-0" onClick={() => void reload()}>
                Retry
              </Button>
            </p>
          ) : null}
          {rows === undefined ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open requisitions yet. Create one above or contact HR.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2" role="list">
              {rows.map((r) => (
                <li key={r.id} className="list-none">
                  <Link
                    href={`/manager/recruiting/requisitions/${r.id}`}
                    className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20"
                  >
                    <p className="font-semibold text-foreground">{r.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {r.status} · {r.openings} opening{r.openings === 1 ? "" : "s"}
                      {r.locationCountry ? ` · ${r.locationCountry}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
