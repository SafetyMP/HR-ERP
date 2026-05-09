"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  apiFetch,
  apiFetchJson,
  AppHttpError,
  normalizeApiError,
} from "@/lib/http/api-client";
import { toastApiError } from "@/lib/http/toast-error";

type FieldSpec = {
  id: string;
  label: string;
  inputType: "text" | "number";
  description?: string;
};

type CatalogResponse = {
  subdivision: string;
  extraFields: FieldSpec[];
};

async function fetchCatalog(subdivision: string): Promise<CatalogResponse> {
  const query = subdivision ? `?subdivision=${encodeURIComponent(subdivision)}` : "";
  return apiFetchJson<CatalogResponse>(`/api/mock/jurisdiction-fields${query}`);
}

const SUBDIVISIONS = [
  { value: "__", label: "Select a payroll location" },
  { value: "BASE", label: "General employee profile (no locality pack)" },
  { value: "CA", label: "California, United States" },
  { value: "NY", label: "New York, United States" },
];

function buildSchema(fields: FieldSpec[]) {
  return z
    .object({
      dynamic: z.record(z.string(), z.coerce.string()),
    })
    .superRefine((val, ctx) => {
      for (const field of fields) {
        const raw = val.dynamic[field.id];
        const asString = raw === undefined || raw === null ? "" : String(raw).trim();
        if (!asString) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field.label} is required.`,
            path: ["dynamic", field.id],
          });
          continue;
        }
        if (field.inputType === "number" && Number.isNaN(Number(asString))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Enter a numeric value.",
            path: ["dynamic", field.id],
          });
        }
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function DynamicPayrollPackForm({ subdivision }: Readonly<{ subdivision: string }>) {
  const catalogQuery = useQuery({
    queryKey: ["jurisdiction-catalog", subdivision],
    queryFn: () => fetchCatalog(subdivision === "BASE" ? "" : subdivision),
    enabled: subdivision !== "__",
  });

  const fields = React.useMemo(
    () => catalogQuery.data?.extraFields ?? [],
    [catalogQuery.data],
  );
  const schema = React.useMemo(() => buildSchema(fields), [fields]);

  const defaultDynamic = React.useMemo(() => {
    return fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.id] = "";
      return acc;
    }, {});
  }, [fields]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dynamic: defaultDynamic,
    },
    mode: "onBlur",
  });

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  if (catalogQuery.isPending) {
    return <p className="text-sm text-zinc-500">Loading locality-specific payroll capture fields…</p>;
  }

  if (catalogQuery.isError) {
    const message =
      catalogQuery.error instanceof Error ? catalogQuery.error.message : "Could not load field catalog.";
    return (
      <Alert>
        <AlertTitle>Unable to load fields</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  if (fields.length === 0) {
    return (
      <Alert>
        <AlertTitle>No additional fields required</AlertTitle>
        <AlertDescription>
          The backend catalog is empty for this selection. Payroll only needs core profile data captured above.
        </AlertDescription>
      </Alert>
    );
  }

  const errorSummaryId = "jurisdiction-field-errors";

  return (
    <FormProvider {...form}>
      <form
        noValidate
        className="space-y-6"
        onSubmit={handleSubmit(() => undefined)}
        aria-describedby={Object.keys(errors).length > 0 ? errorSummaryId : undefined}
      >
        <div className="space-y-6">
          {fields.map((field) => {
            const dynErrors = errors.dynamic;
            const fieldError =
              dynErrors &&
              typeof dynErrors === "object" &&
              field.id in dynErrors &&
              dynErrors[field.id as keyof typeof dynErrors];
            const describeIds = [
              field.description ? `hint-${field.id}` : undefined,
              fieldError ? `err-${field.id}` : undefined,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <fieldset key={field.id} className="space-y-2">
                <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{field.label}</legend>
                {field.description ? (
                  <p id={`hint-${field.id}`} className="text-sm text-zinc-500 dark:text-zinc-400">
                    {field.description}
                  </p>
                ) : null}
                <Controller
                  name={`dynamic.${field.id}`}
                  control={control}
                  render={({ field: controller }) => (
                    <Input
                      {...controller}
                      value={controller.value ?? ""}
                      type={field.inputType === "number" ? "number" : "text"}
                      inputMode={field.inputType === "number" ? "decimal" : "text"}
                      autoComplete="off"
                      aria-invalid={fieldError ? "true" : "false"}
                      aria-describedby={describeIds.length > 0 ? describeIds : undefined}
                      onChange={(e) => controller.onChange(field.inputType === "number" ? e.target.value : e.target.value)}
                    />
                  )}
                />
                {fieldError && typeof fieldError === "object" && "message" in fieldError && fieldError.message ? (
                  <p id={`err-${field.id}`} className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
                    {String(fieldError.message)}
                  </p>
                ) : null}
              </fieldset>
            );
          })}
        </div>
        {Object.keys(errors).length > 0 ? (
          <div id={errorSummaryId} className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            Fix the highlighted issues before submitting to payroll integrations.
          </div>
        ) : null}
        <Button type="submit">Validate locality pack</Button>
      </form>
    </FormProvider>
  );
}

async function simulateServerDenial(kind: "pto" | "generic") {
  const res = await apiFetch(`/api/mock/demo-error`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario: kind === "pto" ? "pto" : "generic" }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new AppHttpError(normalizeApiError(res, text));
  }
}

export function JurisdictionFieldsDemo() {
  const [subdivision, setSubdivision] = React.useState<string>("__");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jurisdiction-responsive payroll intake</CardTitle>
        <CardDescription>
          Choose a locality to fetch the authoritative field bundle from `/api/mock/jurisdiction-fields`. The UI reacts
          instantly without performing tax math on the client.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="jurisdiction-select">Payroll location</Label>
            <Select
              value={subdivision}
              onValueChange={(v) => setSubdivision(v)}
              aria-label="Choose payroll locality"
              required
            >
              <SelectTrigger id="jurisdiction-select" className="w-[min(28rem,calc(100vw-6rem))]">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {SUBDIVISIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" type="button">
                Why locality fields?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Powered by payroll configuration</DialogTitle>
                <DialogDescription>
                  Each jurisdiction exposes an explicit field bundle. We render only what the backend authorizes — no duplicate
                  source of truth inside the browser.
                </DialogDescription>
              </DialogHeader>
              <Button asChild variant="outline">
                <a href="https://www.edd.ca.gov/" rel="noopener noreferrer">
                  External reference: CA EDD
                </a>
              </Button>
            </DialogContent>
          </Dialog>
        </div>
        <div aria-live="polite" className="rounded-md bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
          Selecting <strong>{SUBDIVISIONS.find((item) => item.value === subdivision)?.label ?? subdivision}</strong> drives
          the query key <code className="font-mono text-xs">jurisdiction-catalog/{subdivision}</code>.
        </div>
        {subdivision === "__" ? (
          <p className="text-sm text-zinc-500">Pick a location to load fields.</p>
        ) : (
          <DynamicPayrollPackForm key={subdivision} subdivision={subdivision} />
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t pt-6">
        <Button
          variant="destructive"
          type="button"
          onClick={async () => {
            try {
              await simulateServerDenial("pto");
            } catch (error) {
              if (error instanceof AppHttpError) {
                toastApiError(error.normalized);
              }
            }
          }}
        >
          Simulate PTO denial (toast)
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={async () => {
            try {
              await simulateServerDenial("generic");
            } catch (error) {
              if (error instanceof AppHttpError) {
                toastApiError(error.normalized);
              }
            }
          }}
        >
          Simulate generic 400 (toast)
        </Button>
      </CardFooter>
    </Card>
  );
}
