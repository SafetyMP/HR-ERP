"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type WizardStepId, canGoBack, canGoNext, useOnboardingWizardStore } from "@/stores/onboarding-wizard-store";

const stepTitles: Record<WizardStepId, string> = {
  profile: "Profile basics",
  role: "Role expectations",
  review: "Review & confirm",
};

const STEP_ORDER_LIST: WizardStepId[] = ["profile", "role", "review"];

export function OnboardingWizardDemo() {
  const { step, next, back, reset, bioDraft, setBioDraft } = useOnboardingWizardStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-step onboarding wizard</CardTitle>
        <CardDescription>
          Zustand keeps non-persisted UI progression; authoritative records still live in React Query + APIs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="flex flex-wrap gap-2 text-xs font-medium text-zinc-500">
          {STEP_ORDER_LIST.map((id) => (
            <li
              key={id}
              aria-current={step === id ? "step" : undefined}
              className={
                step === id ? "rounded-full bg-zinc-900 px-3 py-1 text-white dark:bg-zinc-50 dark:text-zinc-900" : "px-3 py-1"
              }
            >
              {stepTitles[id]}
            </li>
          ))}
        </ol>
        <div className="rounded-md border border-dashed border-zinc-200 p-4 dark:border-zinc-800">
          {step === "profile" ? (
            <div className="space-y-2">
              <Label htmlFor="bio-draft">Preferred name and pronouns</Label>
              <Input
                id="bio-draft"
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                aria-describedby="bio-hint"
              />
              <p id="bio-hint" className="text-xs text-zinc-500">
                Draft text stays in the wizard store until you submit to the server.
              </p>
            </div>
          ) : null}
          {step === "role" ? (
            <div className="space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
              <p>Review competencies and systems access. (Static copy for the demo.)</p>
              <ul className="list-disc pl-5">
                <li>SAML SSO to core HR</li>
                <li>Delegated approvals for time off</li>
              </ul>
            </div>
          ) : null}
          {step === "review" ? (
            <div className="text-sm text-zinc-700 dark:text-zinc-200">
              <p>Summary:</p>
              <p className="mt-2 font-mono text-xs text-zinc-500">{bioDraft || "— no draft —"}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => back()} disabled={!canGoBack(step)}>
          Back
        </Button>
        <Button type="button" onClick={() => next()} disabled={!canGoNext(step)}>
          Continue
        </Button>
        <Button type="button" variant="ghost" onClick={() => reset()}>
          Reset wizard
        </Button>
      </CardFooter>
    </Card>
  );
}
