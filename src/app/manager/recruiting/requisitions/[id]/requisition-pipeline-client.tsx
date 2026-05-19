"use client";

import { startTransition, useEffect, useState } from "react";

import { ApplicationInterviewsPanel } from "./application-interviews-panel";
import { STAGE_LABEL } from "../../manager-recruiting-client";
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

type Application = {
  id: string;
  stage: string;
  appliedAt: string;
  candidate: { id: string; fullName: string; sourceChannel: string | null };
};

type Props = {
  requisitionId: string;
  initialBearerToken?: string;
};

const ADVANCE_STAGES = ["SCREENING", "INTERVIEW", "OFFER"] as const;

export function RequisitionPipelineClient({
  requisitionId,
  initialBearerToken,
}: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [apps, setApps] = useState<Application[] | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [offerAppId, setOfferAppId] = useState("");
  const [offerAmount, setOfferAmount] = useState("7500000");
  const [lastOfferId, setLastOfferId] = useState("");
  const [extendProposalId, setExtendProposalId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const res = await hrApiFetch(
      `/api/v1/recruiting/requisitions/${requisitionId}/applications`,
      { bearerToken, headers: { Accept: "application/json" } },
    );
    if (!res.ok) {
      setApps([]);
      return;
    }
    const body = (await res.json()) as {
      data?: { applications?: Application[] };
    };
    setApps(body.data?.applications ?? []);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => setApps(undefined));
    void (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken, requisitionId]);

  const advanceStage = async (applicationId: string, toStage: string) => {
    setBusyId(applicationId);
    setMsg(null);
    try {
      const res = await hrApiFetch(
        `/api/v1/recruiting/applications/${applicationId}/stage`,
        {
          bearerToken,
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ toStage }),
        },
      );
      if (!res.ok) {
        setMsg("Could not update stage. The move may not be allowed for this candidate.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const addCandidate = async () => {
    if (!candidateName.trim() || !candidateEmail.trim()) return;
    setBusyId("new");
    setMsg(null);
    try {
      const res = await hrApiFetch("/api/v1/recruiting/applications", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requisitionId,
          candidate: {
            fullName: candidateName.trim(),
            email: candidateEmail.trim(),
            sourceChannel: "OTHER",
          },
        }),
      });
      if (!res.ok) {
        setMsg("Could not add applicant.");
        return;
      }
      setCandidateName("");
      setCandidateEmail("");
      await load();
      setMsg("Applicant added.");
    } finally {
      setBusyId(null);
    }
  };

  const draftOffer = async () => {
    if (!offerAppId) return;
    setBusyId("offer");
    setMsg(null);
    try {
      const res = await hrApiFetch("/api/v1/recruiting/offers", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: offerAppId,
          baseAnnualAmountMinor: offerAmount,
          currencyCode: "USD",
        }),
      });
      if (res.status === 403) {
        setMsg("You do not have permission to create offers for this application.");
        return;
      }
      if (!res.ok) {
        setMsg("Could not create offer. Application may need to be in Offer stage.");
        return;
      }
      const body = (await res.json()) as { data?: { offerId?: string } };
      if (body.data?.offerId) setLastOfferId(body.data.offerId);
      setMsg("Offer drafted.");
    } finally {
      setBusyId(null);
    }
  };

  const extendOffer = async () => {
    if (!lastOfferId || !extendProposalId.trim()) return;
    setBusyId("extend");
    setMsg(null);
    try {
      const res = await hrApiFetch(`/api/v1/recruiting/offers/${lastOfferId}/extend`, {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorizingProposalId: extendProposalId.trim(),
        }),
      });
      if (res.status === 403) {
        setMsg("You do not have permission to extend this offer.");
        return;
      }
      if (!res.ok) {
        setMsg("Could not extend offer. Check the authorizing proposal ID.");
        return;
      }
      setMsg("Offer extended.");
    } finally {
      setBusyId(null);
    }
  };

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Checking session…</p>;
  }

  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="Applicant pipeline"
        description="Sign in to manage candidates."
        returnTo={`/manager/recruiting/requisitions/${requisitionId}`}
        onDevTokenPaste={persistBearer}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add applicant</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            placeholder="Full name"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => void addCandidate()}
            disabled={busyId === "new"}
          >
            Add to pipeline
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
          <CardDescription>Advance candidates through hiring stages.</CardDescription>
        </CardHeader>
        <CardContent>
          {apps === undefined ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applicants yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border" role="list">
              {apps.map((a) => (
                <li key={a.id} className="list-none px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">{a.candidate.fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {STAGE_LABEL[a.stage] ?? a.stage} · applied{" "}
                    {new Date(a.appliedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ADVANCE_STAGES.map((stage) => (
                      <Button
                        key={stage}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === a.id || a.stage === "REJECTED"}
                        onClick={() => void advanceStage(a.id, stage)}
                      >
                        → {STAGE_LABEL[stage] ?? stage}
                      </Button>
                    ))}
                    {a.stage !== "REJECTED" && a.stage !== "HIRED" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busyId === a.id}
                        onClick={() => void advanceStage(a.id, "REJECTED")}
                      >
                        Reject
                      </Button>
                    ) : null}
                  </div>
                  <ApplicationInterviewsPanel
                    applicationId={a.id}
                    bearerToken={bearerToken}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Draft offer</CardTitle>
          <CardDescription>For a candidate already in Offer stage.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="text-sm">
            Application ID
            <Input
              className="mt-1 font-mono text-xs"
              value={offerAppId}
              onChange={(e) => setOfferAppId(e.target.value)}
              placeholder="Paste application UUID"
            />
          </label>
          <label className="text-sm">
            Annual base (minor units, e.g. cents)
            <Input
              className="mt-1"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
            />
          </label>
          <Button
            type="button"
            onClick={() => void draftOffer()}
            disabled={busyId === "offer"}
          >
            Create offer
          </Button>
          {lastOfferId ? (
            <p className="text-xs text-muted-foreground font-mono">Last offer ID: {lastOfferId}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extend offer</CardTitle>
          <CardDescription>Requires a governance authorizing proposal ID.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            placeholder="Authorizing proposal ID (UUID)"
            value={extendProposalId}
            onChange={(e) => setExtendProposalId(e.target.value)}
            className="font-mono text-xs"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void extendOffer()}
            disabled={busyId === "extend" || !lastOfferId}
          >
            Extend last offer
          </Button>
        </CardContent>
      </Card>

      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </div>
  );
}
