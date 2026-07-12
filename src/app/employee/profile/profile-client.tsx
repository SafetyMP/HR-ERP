"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
import { Label } from "@/components/ui/label";
import { meQueryKeys } from "@/lib/ess/me-query-keys";
import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";
import type { EmployeeSelfProfilePayload } from "@/lib/profile/employee-self-profile-mapper";
import { useProfileQuery } from "@/lib/profile/use-profile-query";

type FieldPolicyMap = Record<string, "hr_maintained" | "self_editable">;

export type EmployeeSelfProfileApi = EmployeeSelfProfilePayload;

type EditableDraft = {
  preferredName: string;
  personalEmail: string;
  phone: string;
  mailingAddressLine1: string;
  mailingAddressLine2: string;
  mailingCity: string;
  mailingRegion: string;
  mailingPostalCode: string;
  mailingCountry: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
};

function emptyDraft(): EditableDraft {
  return {
    preferredName: "",
    personalEmail: "",
    phone: "",
    mailingAddressLine1: "",
    mailingAddressLine2: "",
    mailingCity: "",
    mailingRegion: "",
    mailingPostalCode: "",
    mailingCountry: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  };
}

function draftFromProfile(p: EmployeeSelfProfileApi): EditableDraft {
  return {
    preferredName: p.preferredName ?? "",
    personalEmail: p.personalEmail ?? "",
    phone: p.phone ?? "",
    mailingAddressLine1: p.mailingAddress.line1 ?? "",
    mailingAddressLine2: p.mailingAddress.line2 ?? "",
    mailingCity: p.mailingAddress.city ?? "",
    mailingRegion: p.mailingAddress.region ?? "",
    mailingPostalCode: p.mailingAddress.postalCode ?? "",
    mailingCountry: p.mailingAddress.country ?? "",
    emergencyContactName: p.emergencyContact.name ?? "",
    emergencyContactPhone: p.emergencyContact.phone ?? "",
    emergencyContactRelationship: p.emergencyContact.relationship ?? "",
  };
}

function nullableTrim(s: string): string | null {
  const t = s.trim();
  return t.length === 0 ? null : t;
}

function buildPatchBody(d: EditableDraft): Record<string, string | null> {
  return {
    preferredName: nullableTrim(d.preferredName),
    personalEmail: nullableTrim(d.personalEmail),
    phone: nullableTrim(d.phone),
    mailingAddressLine1: nullableTrim(d.mailingAddressLine1),
    mailingAddressLine2: nullableTrim(d.mailingAddressLine2),
    mailingCity: nullableTrim(d.mailingCity),
    mailingRegion: nullableTrim(d.mailingRegion),
    mailingPostalCode: nullableTrim(d.mailingPostalCode),
    mailingCountry: nullableTrim(d.mailingCountry),
    emergencyContactName: nullableTrim(d.emergencyContactName),
    emergencyContactPhone: nullableTrim(d.emergencyContactPhone),
    emergencyContactRelationship: nullableTrim(d.emergencyContactRelationship),
  };
}

type Props = {
  initialBearerToken?: string;
};

async function saveProfile(
  bearerToken: string | null,
  draft: EditableDraft,
): Promise<{
  profile: EmployeeSelfProfileApi | null;
  confirmationMessage: string | null;
  ok: boolean;
  retryable: boolean;
}> {
  const res = await hrApiFetch("/api/v1/me/profile", {
    bearerToken,
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildPatchBody(draft)),
  });

  if (res.status === 401) {
    return {
      profile: null,
      confirmationMessage: null,
      ok: false,
      retryable: false,
    };
  }

  const body = (await res.json()) as {
    data?: {
      profile: EmployeeSelfProfileApi;
      fieldPolicy: FieldPolicyMap;
      confirmationMessage: string;
    };
    error?: { code?: string; message?: string };
  };

  if (!res.ok) {
    return {
      profile: null,
      confirmationMessage: null,
      ok: false,
      retryable: res.status >= 500,
    };
  }

  return {
    profile: body.data?.profile ?? null,
    confirmationMessage: body.data?.confirmationMessage ?? null,
    ok: true,
    retryable: false,
  };
}

function HrNote() {
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      Maintained by HR — contact HR Operations to request a change.
    </p>
  );
}

export function EmployeeProfileClient({ initialBearerToken }: Props) {
  const queryClient = useQueryClient();
  const { bearerToken, ready, isAuthenticated, persistBearer, signOut } =
    useHrAccess(initialBearerToken);
  const {
    data: envelope,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProfileQuery();
  const profile = envelope?.profile;
  const [draft, setDraft] = useState<EditableDraft>(emptyDraft());
  const [saveError, setSaveError] = useState<"recoverable" | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    startTransition(() => {
      setDraft(draftFromProfile(profile));
    });
  }, [profile]);

  const onSave = useCallback(async () => {
    if (!isAuthenticated || !profile) return;
    setSaving(true);
    setSaveError(null);
    setConfirmationMessage(null);
    const result = await saveProfile(bearerToken, draft);
    setSaving(false);
    if (!result.ok && !result.retryable) {
      void signOut();
      return;
    }
    if (!result.ok) {
      setSaveError("recoverable");
      return;
    }
    if (result.profile) {
      await queryClient.invalidateQueries({ queryKey: meQueryKeys.profile });
    }
    setConfirmationMessage(
      result.confirmationMessage ?? "Your profile updates were saved.",
    );
  }, [isAuthenticated, bearerToken, profile, draft, queryClient, signOut]);

  const emergencyUnset = useMemo(() => {
    if (!profile) return true;
    const ec = profile.emergencyContact;
    return (
      !(ec.name && ec.name.trim()) &&
      !(ec.phone && ec.phone.trim()) &&
      !(ec.relationship && ec.relationship.trim())
    );
  }, [profile]);

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
        title="My profile"
        description="Sign in to view and update your HR profile."
        returnTo="/employee/profile"
        onDevTokenPaste={persistBearer}
      />
    );
  }

  if (isError) {
    const recoverable =
      error instanceof Error &&
      !error.message.includes("401") &&
      !error.message.toLowerCase().includes("unauthorized");
    if (recoverable) {
      return (
        <div className="mx-auto w-full max-w-lg space-y-4">
          <div role="alert">
            <h2 className="text-lg font-semibold text-foreground">
              We couldn&apos;t load your profile
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please try again in a moment. If this keeps happening, contact HR
              Operations.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            Retry
          </Button>
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div role="alert">
          <h2 className="text-lg font-semibold text-foreground">
            Session issue
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your session could not be verified. Sign in again and return to your
            profile.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => signOut()}>
          Sign out and start over
        </Button>
      </div>
    );
  }

  if (isLoading || profile === undefined) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading your profile…
      </p>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-8">
      {confirmationMessage ? (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
        >
          {confirmationMessage}
        </div>
      ) : null}

      {saveError === "recoverable" ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
        >
          We couldn&apos;t save your updates. Please try again. If it continues,
          contact HR Operations.
        </div>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle id="identity-heading">
            Identity &amp; reachability
          </CardTitle>
          <CardDescription>
            What HR uses for payroll, benefits, and workplace systems.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="legal-given">Legal given name</Label>
            <HrNote />
            <Input
              id="legal-given"
              className="mt-2"
              readOnly
              disabled
              value={profile.legalGivenName ?? ""}
              aria-readonly="true"
            />
          </div>
          <div>
            <Label htmlFor="legal-family">Legal family name</Label>
            <HrNote />
            <Input
              id="legal-family"
              className="mt-2"
              readOnly
              disabled
              value={profile.legalFamilyName ?? ""}
              aria-readonly="true"
            />
          </div>
          <div>
            <Label htmlFor="preferred">Preferred name</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Shown on badges and internal tools — not your legal tax name.
            </p>
            <Input
              id="preferred"
              className="mt-2"
              value={draft.preferredName}
              onChange={(e) => {
                setDraft((d) => ({ ...d, preferredName: e.target.value }));
                setConfirmationMessage(null);
              }}
              autoComplete="nickname"
            />
          </div>
          <div>
            <Label htmlFor="work-email">Work email</Label>
            <HrNote />
            <Input
              id="work-email"
              className="mt-2"
              readOnly
              disabled
              value={profile.workEmail}
              aria-readonly="true"
            />
          </div>
          <div>
            <Label htmlFor="personal-email">Personal email</Label>
            <Input
              id="personal-email"
              type="email"
              className="mt-2"
              value={draft.personalEmail}
              onChange={(e) => {
                setDraft((d) => ({ ...d, personalEmail: e.target.value }));
                setConfirmationMessage(null);
              }}
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="phone">Mobile or primary phone</Label>
            <Input
              id="phone"
              type="tel"
              className="mt-2"
              value={draft.phone}
              onChange={(e) => {
                setDraft((d) => ({ ...d, phone: e.target.value }));
                setConfirmationMessage(null);
              }}
              autoComplete="tel"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle id="mailing-heading">Mailing address</CardTitle>
          <CardDescription>
            For mailed correspondence and tax documents when applicable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="addr1">Address line 1</Label>
            <Input
              id="addr1"
              className="mt-2"
              value={draft.mailingAddressLine1}
              onChange={(e) => {
                setDraft((d) => ({
                  ...d,
                  mailingAddressLine1: e.target.value,
                }));
                setConfirmationMessage(null);
              }}
              autoComplete="address-line1"
            />
          </div>
          <div>
            <Label htmlFor="addr2">Address line 2</Label>
            <Input
              id="addr2"
              className="mt-2"
              value={draft.mailingAddressLine2}
              onChange={(e) => {
                setDraft((d) => ({
                  ...d,
                  mailingAddressLine2: e.target.value,
                }));
                setConfirmationMessage(null);
              }}
              autoComplete="address-line2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                className="mt-2"
                value={draft.mailingCity}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, mailingCity: e.target.value }));
                  setConfirmationMessage(null);
                }}
                autoComplete="address-level2"
              />
            </div>
            <div>
              <Label htmlFor="region">Region / state</Label>
              <Input
                id="region"
                className="mt-2"
                value={draft.mailingRegion}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, mailingRegion: e.target.value }));
                  setConfirmationMessage(null);
                }}
                autoComplete="address-level1"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="postal">Postal code</Label>
              <Input
                id="postal"
                className="mt-2"
                value={draft.mailingPostalCode}
                onChange={(e) => {
                  setDraft((d) => ({
                    ...d,
                    mailingPostalCode: e.target.value,
                  }));
                  setConfirmationMessage(null);
                }}
                autoComplete="postal-code"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                className="mt-2"
                value={draft.mailingCountry}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, mailingCountry: e.target.value }));
                  setConfirmationMessage(null);
                }}
                autoComplete="country-name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle id="emergency-heading">Emergency contact</CardTitle>
          <CardDescription>
            Someone we can reach if you need urgent help at work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emergencyUnset ? (
            <p className="rounded-md border border-dashed border-border bg-muted px-3 py-2 text-sm text-foreground">
              You haven&apos;t added an emergency contact yet. Adding one helps
              your team respond quickly if you ever need assistance during work
              hours.
            </p>
          ) : null}
          <div>
            <Label htmlFor="ec-name">Contact name</Label>
            <Input
              id="ec-name"
              className="mt-2"
              value={draft.emergencyContactName}
              onChange={(e) => {
                setDraft((d) => ({
                  ...d,
                  emergencyContactName: e.target.value,
                }));
                setConfirmationMessage(null);
              }}
            />
          </div>
          <div>
            <Label htmlFor="ec-phone">Contact phone</Label>
            <Input
              id="ec-phone"
              type="tel"
              className="mt-2"
              value={draft.emergencyContactPhone}
              onChange={(e) => {
                setDraft((d) => ({
                  ...d,
                  emergencyContactPhone: e.target.value,
                }));
                setConfirmationMessage(null);
              }}
            />
          </div>
          <div>
            <Label htmlFor="ec-rel">Relationship</Label>
            <Input
              id="ec-rel"
              className="mt-2"
              value={draft.emergencyContactRelationship}
              onChange={(e) => {
                setDraft((d) => ({
                  ...d,
                  emergencyContactRelationship: e.target.value,
                }));
                setConfirmationMessage(null);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={saving} onClick={() => void onSave()}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
