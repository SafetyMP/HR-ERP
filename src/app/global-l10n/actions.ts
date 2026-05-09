"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import {
  bootstrapGlobalL10nDemo,
} from "@/lib/l10n/seed-demo";
import { withTenantRls } from "@/lib/l10n/prisma-tenant";
import {
  PayoutValidationError,
  validatePayoutDraft,
} from "@/lib/payroll/validate-payout";
import {
  rebuildStatutoryAdjustmentsForSprint,
} from "@/lib/holidays/sprint-capacity";
import { syncNagerCalendarYear } from "@/lib/holidays/nager-sync";

export async function ensureGlobalL10nDemoAction(): Promise<void> {
  await bootstrapGlobalL10nDemo();
  revalidatePath("/global-l10n/profile");
}

export async function rebuildSprintStatutoryAdjustmentsAction(
  sprintId: string,
): Promise<void> {
  const tenantId = getDemoTenantId();
  await withTenantRls(prisma, tenantId, "capacity-rebuild", async (tx) => {
    await rebuildStatutoryAdjustmentsForSprint(tx, sprintId);
  });
  revalidatePath("/global-l10n/planning/sprint");
}

export async function syncNagerHolidayCalendarAction(formData: FormData): Promise<void> {
  const calendarId = String(formData.get("calendarId") ?? "");
  const year = Number.parseInt(String(formData.get("year") ?? ""), 10);

  const tenantId = getDemoTenantId();

  try {
    await withTenantRls(
      prisma,
      tenantId,
      "holiday-sync",
      async (tx) => syncNagerCalendarYear(tx, calendarId, year),
    );
    revalidatePath("/global-l10n/planning/sprint");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown sync error";
    throw new Error(msg);
  }
}

export async function upsertSchedulingPreferenceAction(
  formData: FormData,
): Promise<void> {
  const employeeId = String(formData.get("employeeId"));
  const asyncFirstDefault = formData.get("asyncFirstDefault") === "on";
  const overlapWindowMinutes = Number.parseInt(
    String(formData.get("overlapWindowMinutes") ?? "30"),
    10,
  );
  const qhStartRaw = formData.get("quietHoursStartMinute");
  const qhEndRaw = formData.get("quietHoursEndMinute");

  const tenantId = getDemoTenantId();
  await withTenantRls(prisma, tenantId, "sched-pref", async (tx) => {
    await tx.schedulingPreference.upsert({
      where: { employeeId },
      create: {
        employeeId,
        asyncFirstDefault,
        overlapWindowMinutes,
        quietHoursStartMinute:
          qhStartRaw !== null && qhStartRaw !== ""
            ? Number.parseInt(String(qhStartRaw), 10)
            : null,
        quietHoursEndMinute:
          qhEndRaw !== null && qhEndRaw !== ""
            ? Number.parseInt(String(qhEndRaw), 10)
            : null,
      },
      update: {
        asyncFirstDefault,
        overlapWindowMinutes,
        quietHoursStartMinute:
          qhStartRaw !== null && qhStartRaw !== ""
            ? Number.parseInt(String(qhStartRaw), 10)
            : null,
        quietHoursEndMinute:
          qhEndRaw !== null && qhEndRaw !== ""
            ? Number.parseInt(String(qhEndRaw), 10)
            : null,
      },
    });
  });
  revalidatePath("/global-l10n/scheduling");
}

export async function upsertEmployeeWorkContextAction(
  formData: FormData,
): Promise<void> {
  const employeeId = String(formData.get("employeeId"));
  const primaryTimezone = String(formData.get("primaryTimezone"));
  const locale = String(formData.get("locale"));
  const calendarSystemRaw = String(formData.get("calendarSystem"));

  type Cal = import("@/app/generated/prisma/client").CalendarSystem;
  const calendarSystem = calendarSystemRaw as Cal;

  await withTenantRls(prisma, getDemoTenantId(), "work-ctx", async (tx) => {
    await tx.employeeWorkContext.upsert({
      where: { employeeId },
      create: {
        employeeId,
        primaryTimezone,
        locale,
        calendarSystem,
        givenName: String(formData.get("givenName") ?? ""),
        familyName: String(formData.get("familyName") ?? ""),
        displayName:
          String(formData.get("displayName") ?? "").trim() || null,
        nameOrderPreference: String(
          formData.get("nameOrderPreference") ?? "GIVEN_FAMILY",
        ) as import("@/app/generated/prisma/client").NameOrderPreference,
      },
      update: {
        primaryTimezone,
        locale,
        calendarSystem,
        givenName: String(formData.get("givenName") ?? ""),
        familyName: String(formData.get("familyName") ?? ""),
        displayName:
          String(formData.get("displayName") ?? "").trim() || null,
        nameOrderPreference: String(
          formData.get("nameOrderPreference") ?? "GIVEN_FAMILY",
        ) as import("@/app/generated/prisma/client").NameOrderPreference,
      },
    });
  });
  revalidatePath("/global-l10n/profile");
}

export async function saveContractorSplitPayoutAction(
  formData: FormData,
): Promise<void> {
  const employeeId = String(formData.get("employeeId"));
  const memo = String(formData.get("memo") ?? "");

  const lineTypes = formData.getAll("lineType") as string[];
  const percents = formData.getAll("percentBp") as string[];
  const amounts = formData.getAll("amountMinor") as string[];
  const currencyCodes = formData.getAll("currencyCode") as string[];
  const cryptoIds = formData.getAll("cryptoAssetId") as string[];

  const tenantId = getDemoTenantId();

  const org = await withTenantRls(
    prisma,
    tenantId,
    "payout-read",
    async (tx) => tx.organization.findUniqueOrThrow({ where: { id: tenantId } }),
  );

  const lines = lineTypes.map((lt, i) => ({
    lineType: lt as import("@/app/generated/prisma/client").PayoutLineType,
    amountMinor:
      amounts[i] !== undefined && amounts[i] !== ""
        ? Number.parseInt(amounts[i]!, 10)
        : null,
    allocationBasisPoints:
      percents[i] !== undefined && percents[i] !== ""
        ? Number.parseInt(percents[i]!, 10)
        : null,
    currencyCode:
      currencyCodes[i] !== undefined && currencyCodes[i] !== ""
        ? currencyCodes[i]!
        : null,
    cryptoAssetId:
      cryptoIds[i] !== undefined && cryptoIds[i] !== ""
        ? cryptoIds[i]!
        : null,
  }));

  try {
    validatePayoutDraft(org.payoutSplitMode, lines);
  } catch (e: unknown) {
    if (e instanceof PayoutValidationError) {
      throw new Error(e.message);
    }
    throw e;
  }

  await withTenantRls(prisma, tenantId, "payout-write", async (tx) => {
    const instruction = await tx.paymentInstruction.create({
      data: {
        tenantId,
        employeeId,
        memo: memo || null,
      },
    });

    await tx.payoutLine.createMany({
      data: lines.map((line, sortOrder) => ({
        paymentInstructionId: instruction.id,
        lineType: line.lineType,
        sortOrder,
        amountMinor: line.amountMinor,
        allocationBasisPoints: line.allocationBasisPoints,
        currencyCode: line.currencyCode,
        cryptoAssetId: line.cryptoAssetId,
      })),
    });
  });

  revalidatePath("/global-l10n/payroll/splits");
}

export async function rebuildSprintCapacityFromForm(
  formData: FormData,
): Promise<void> {
  const sprintId = String(formData.get("sprintId"));
  await rebuildSprintStatutoryAdjustmentsAction(sprintId);
}
