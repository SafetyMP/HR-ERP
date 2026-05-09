"use client";

import {
  clearDevBearerTokenFromSession,
  readDevBearerTokenFromSession,
  writeDevBearerTokenToSession,
} from "@/lib/auth/dev-bearer-session";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";

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


type FieldPolicyMap = Record<string, "hr_maintained" | "self_editable">;

export type EmployeeSelfProfileApi = {
  legalGivenName: string | null;
  legalFamilyName: string | null;
  preferredName: string | null;
  workEmail: string;
  personalEmail: string | null;
  phone: string | null;
  mailingAddress: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
  };
  emergencyContact: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  };
};

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

async function fetchProfile(token: string): Promise<{
  profile: EmployeeSelfProfileApi | null;
  ok: boolean;
  retryable: boolean;
  apiMessage?: string;
}> {
  const res = await fetch("/api/v1/me/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  let body: {
    data?: { profile: EmployeeSelfProfileApi; fieldPolicy: FieldPolicyMap };
    error?: { code?: string; message?: string };
  } = {};

  try {
    body = (await res.json()) as typeof body;
  } catch {
    body = {};
  }

  const apiMessage =
    typeof body.error?.message === "string" ? body.error.message : undefined;

  if (!res.ok) {
    return {
      profile: null,
      ok: false,
      retryable: res.status >= 500,
      apiMessage,
    };
  }

  return {
    profile: body.data?.profile ?? null,
    ok: true,
    retryable: false,
  };
}

async function saveProfile(
  token: string,
  draft: EditableDraft,
): Promise<{
  profile: EmployeeSelfProfileApi | null;
  confirmationMessage: string | null;
  ok: boolean;
  retryable: boolean;
}> {
  const res = await fetch("/api/v1/me/profile", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
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
    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
      Maintained by HR — contact HR Operations to request a change.
    </p>
  );
}

export function EmployeeProfileClient({ initialBearerToken }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [profile, setProfile] = useState<EmployeeSelfProfileApi | null | undefined>(undefined);
  const [draft, setDraft] = useState<EditableDraft>(emptyDraft());
  const [loadError, setLoadError] = useState<"auth" | "recoverable" | null>(null);
  const [authHint, setAuthHint] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<"recoverable" | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startTransition(() => {
      const fromStorage = readDevBearerTokenFromSession();
      if (fromStorage) {
        setTokenState(fromStorage);
      } else if (initialBearerToken?.trim()) {
        const t = writeDevBearerTokenToSession(initialBearerToken);
        if (t) setTokenState(t);
      }
    });
  }, [initialBearerToken]);

  const applyLoadedProfile = useCallback((p: EmployeeSelfProfileApi) => {
    setProfile(p);
    setDraft(draftFromProfile(p));
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    startTransition(() => {
      setLoadError(null);
      setAuthHint(null);
      setProfile(undefined);
      setDraft(emptyDraft());
      setConfirmationMessage(null);
    });

    void (async () => {
      const result = await fetchProfile(token);
      if (cancelled) return;
      if (!result.ok && !result.retryable) {
        setLoadError("auth");
        setAuthHint(result.apiMessage ?? null);
        setProfile(null);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setProfile(null);
        return;
      }
      if (!result.profile) {
        setLoadError("recoverable");
        setProfile(null);
        return;
      }
      applyLoadedProfile(result.profile);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, applyLoadedProfile]);

  const retryLoad = useCallback(() => {
    if (!token) return;
    startTransition(() => {
      setLoadError(null);
      setAuthHint(null);
      setProfile(undefined);
    });
    void (async () => {
      const result = await fetchProfile(token);
      if (!result.ok && !result.retryable) {
        setLoadError("auth");
        setAuthHint(result.apiMessage ?? null);
        setProfile(null);
        return;
      }
      if (!result.ok) {
        setLoadError("recoverable");
        setProfile(null);
        return;
      }
      if (!result.profile) {
        setLoadError("recoverable");
        setProfile(null);
        return;
      }
      applyLoadedProfile(result.profile);
    })();
  }, [token, applyLoadedProfile]);

  const onSave = useCallback(async () => {
    if (!token || profile === undefined || profile === null) return;
    setSaving(true);
    setSaveError(null);
    setConfirmationMessage(null);
    const result = await saveProfile(token, draft);
    setSaving(false);
    if (!result.ok && !result.retryable) {
      setLoadError("auth");
      return;
    }
    if (!result.ok) {
      setSaveError("recoverable");
      return;
    }
    if (result.profile) {
      applyLoadedProfile(result.profile);
    }
    setConfirmationMessage(result.confirmationMessage ?? "Your profile updates were saved.");
  }, [token, profile, draft, applyLoadedProfile]);

  const emergencyUnset = useMemo(() => {
    if (!profile) return true;
    const ec = profile.emergencyContact;
    return (
      !(ec.name && ec.name.trim()) &&
      !(ec.phone && ec.phone.trim()) &&
      !(ec.relationship && ec.relationship.trim())
    );
  }, [profile]);

  const devHint =
    process.env.NODE_ENV === "development" ? (
      <p className="mt-4 rounded-md border border-dashed border-zinc-300 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        Dev only: run <code className="font-mono">npm run jwt:dev</code> from the repo root — it loads{" "}
        <code className="font-mono">.env</code> so <code className="font-mono">JWT_SECRET</code> matches{" "}
        <code className="font-mono">npm run dev</code>. Defaults align with demo bootstrap (
        <code className="font-mono">default-tenant</code>, seeded Jordan employee). Employee JWT needs{" "}
        <code className="font-mono">employees:read</code> and <code className="font-mono">profile:self_update</code>{" "}
        (included in <code className="font-mono">employee</code> role).
      </p>
    ) : null;

  if (!token) {
    return (
      <Card className="mx-auto w-full max-w-lg shadow-sm">
        <CardHeader>
          <CardTitle>My profile</CardTitle>
          <CardDescription>
            Sign in to view your HR profile. Your session token was not found on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="hrerp-profile-token">
            Paste bearer token (development)
          </label>
          <textarea
            id="hrerp-profile-token"
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
            rows={3}
            placeholder="Paste JWT (npm run jwt:dev) — raw eyJ… or Bearer eyJ…"
            onChange={(e) => {
              const t = writeDevBearerTokenToSession(e.target.value);
              if (t) setTokenState(t);
            }}
          />
          {devHint}
        </CardContent>
      </Card>
    );
  }

  if (loadError === "recoverable") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div role="alert">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">We couldn&apos;t load your profile</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Please try again in a moment. If this keeps happening, contact HR Operations.
          </p>
        </div>
        <Button type="button" onClick={() => retryLoad()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loadError === "auth") {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4">
        <div role="alert">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Session issue</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Your session could not be verified. Mint a fresh token with{" "}
            <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">npm run jwt:dev</code> using the
            same <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">JWT_SECRET</code> as this dev
            server, then paste the printed line below.
          </p>
          {authHint ? (
            <p className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-2 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {authHint}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearDevBearerTokenFromSession();
            setTokenState(null);
            setLoadError(null);
            setAuthHint(null);
            setProfile(undefined);
          }}
        >
          Clear token and start over
        </Button>
      </div>
    );
  }

  if (profile === undefined) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Loading your profile…
      </p>
    );
  }

  if (profile === null) {
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
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          We couldn&apos;t save your updates. Please try again. If it continues, contact HR Operations.
        </div>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle id="identity-heading">Identity &amp; reachability</CardTitle>
          <CardDescription>What HR uses for payroll, benefits, and workplace systems.</CardDescription>
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
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
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
            <Input id="work-email" className="mt-2" readOnly disabled value={profile.workEmail} aria-readonly="true" />
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
          <CardDescription>For mailed correspondence and tax documents when applicable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="addr1">Address line 1</Label>
            <Input
              id="addr1"
              className="mt-2"
              value={draft.mailingAddressLine1}
              onChange={(e) => {
                setDraft((d) => ({ ...d, mailingAddressLine1: e.target.value }));
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
                setDraft((d) => ({ ...d, mailingAddressLine2: e.target.value }));
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
                  setDraft((d) => ({ ...d, mailingPostalCode: e.target.value }));
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
          <CardDescription>Someone we can reach if you need urgent help at work.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emergencyUnset ? (
            <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              You haven&apos;t added an emergency contact yet. Adding one helps your team respond quickly if you ever
              need assistance during work hours.
            </p>
          ) : null}
          <div>
            <Label htmlFor="ec-name">Contact name</Label>
            <Input
              id="ec-name"
              className="mt-2"
              value={draft.emergencyContactName}
              onChange={(e) => {
                setDraft((d) => ({ ...d, emergencyContactName: e.target.value }));
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
                setDraft((d) => ({ ...d, emergencyContactPhone: e.target.value }));
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
                setDraft((d) => ({ ...d, emergencyContactRelationship: e.target.value }));
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
