import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import { withTenantRls } from "@/lib/l10n/prisma-tenant";
import { summarizeSprintCapacityForTenant } from "@/lib/holidays/sprint-capacity";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sprintId: string }> },
): Promise<Response> {
  try {
    const { sprintId } = await context.params;
    const tenantId = getDemoTenantId();

    const rows = await withTenantRls(
      prisma,
      tenantId,
      "capacity-read",
      async (tx) => summarizeSprintCapacityForTenant(tx, sprintId),
    );

    return NextResponse.json({ sprintId, rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "capacity_read_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
