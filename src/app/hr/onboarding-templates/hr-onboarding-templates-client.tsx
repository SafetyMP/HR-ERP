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


type Tpl = { id: string; title: string; itemCount: number };

type Props = {
  initialBearerToken?: string;
};

export function HrOnboardingTemplatesClient({ initialBearerToken }: Props) {
  const { bearerToken, ready, isAuthenticated, persistBearer } =
    useHrAccess(initialBearerToken);
  const [templates, setTemplates] = useState<Tpl[] | undefined>(undefined);
  const [employeeId, setEmployeeId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    startTransition(() => setTemplates(undefined));
    void (async () => {
      const res = await hrApiFetch("/api/v1/hr/onboarding/templates", {
        bearerToken,
        headers: { Accept: "application/json" },
      });
      if (cancelled) return;
      if (!res.ok) {
        setTemplates([]);
        return;
      }
      const body = (await res.json()) as { data?: { onboardingTemplates?: Tpl[] } };
      const tpls = body.data?.onboardingTemplates ?? [];
      setTemplates(tpls);
      setTemplateId((prev) => (prev.trim() ? prev : tpls[0]?.id ?? ""));
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, bearerToken]);

  const apply = async () => {
    if (!isAuthenticated) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await hrApiFetch("/api/v1/hr/onboarding/apply-template", {
        bearerToken,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          templateId: templateId.trim(),
        }),
      });
      if (!res.ok) {
        setMsg("Apply failed — verify UUIDs belong to this tenant.");
        return;
      }
      const body = (await res.json()) as { data?: { onboardingTemplateApply?: { createdTasks: number } } };
      const created = body.data?.onboardingTemplateApply?.createdTasks ?? 0;
      setMsg(`Added ${created} new onboarding task(s). Duplicates by title are skipped.`);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Checking your session…
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <HrSignInCard
        title="Onboarding templates"
        description="Sign in to manage onboarding templates."
        returnTo="/hr/onboarding-templates"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>HR-authored reusable checklists — applying clones tasks only when titles differ.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {templates === undefined ? (
            <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
          ) : templates.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">No templates for this tenant.</p>
          ) : (
            <ul className="space-y-1" role="list">
              {templates.map((t) => (
                <li key={t.id}>
                  <code className="text-xs">{t.id}</code> — {t.title} ({t.itemCount} steps)
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Apply to employee</CardTitle>
          <CardDescription>Provide Core HR employee UUID + template UUID.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <label className="font-medium" htmlFor="tpl-emp">
              Employee ID
            </label>
            <input
              id="tpl-emp"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="uuid"
            />
          </div>
          <div>
            <label className="font-medium" htmlFor="tpl-id">
              Template ID
            </label>
            <input
              id="tpl-id"
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="uuid"
            />
          </div>
          {msg ? <p className="text-zinc-700 dark:text-zinc-300">{msg}</p> : null}
          <Button type="button" disabled={busy || !employeeId.trim() || !templateId.trim()} onClick={() => void apply()}>
            {busy ? "Applying…" : "Apply template"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
