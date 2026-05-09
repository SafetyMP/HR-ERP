import type {
  EmployeeWorkContext,
  NameOrderPreference,
} from "@/app/generated/prisma/client";

const ORDER: Record<
  NameOrderPreference,
  (given: string, family: string) => string[]
> = {
  GIVEN_FAMILY: (given, family) => [given, family].filter(Boolean),
  FAMILY_GIVEN: (family, given) => [family, given].filter(Boolean),
  LEGAL_DOCUMENT_ORDER: (given, family) => [given, family].filter(Boolean),
};

function effectiveGiven(ctx: EmployeeWorkContext): string {
  return (ctx.givenName ?? "").trim();
}

function effectiveFamily(ctx: EmployeeWorkContext): string {
  return (ctx.familyName ?? "").trim();
}

export function formatStructuredDisplayName(ctx: EmployeeWorkContext): string {
  if ((ctx.displayName ?? "").trim()) {
    return ctx.displayName!.trim();
  }
  const pref = ORDER[ctx.nameOrderPreference] ?? ORDER.GIVEN_FAMILY;
  return pref(effectiveGiven(ctx), effectiveFamily(ctx)).join(" ").trim() || "(no name)";
}
